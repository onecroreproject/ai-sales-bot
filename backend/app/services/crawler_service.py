import re
import httpx
from html.parser import HTMLParser
from urllib.parse import urlparse, urljoin
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product_knowledge import ProductKnowledge
from app.ai.embeddings import create_embedding
import logging

logger = logging.getLogger(__name__)


class WebpageTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.ignore_tags = {"script", "style", "nav", "footer", "header", "noscript", "svg", "form"}
        self.current_tag_stack = []
        self.text_chunks = []

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        self.current_tag_stack.append(tag_lower)
        if tag_lower == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower == "title":
            self.in_title = False
        if self.current_tag_stack and self.current_tag_stack[-1] == tag_lower:
            self.current_tag_stack.pop()

    def handle_data(self, data):
        for ignored in self.ignore_tags:
            if ignored in self.current_tag_stack:
                return

        text = data.strip()
        if not text:
            return

        if self.in_title and not self.title:
            self.title = text
        else:
            self.text_chunks.append(text)


class LinkExtractor(HTMLParser):
    """Extracts internal links on the same host."""
    def __init__(self, current_page_url: str, base_domain: str):
        super().__init__()
        self.current_page_url = current_page_url
        self.base_domain = base_domain.lower()
        self.internal_links = set()

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            for attr_name, attr_val in attrs:
                if attr_name.lower() == "href" and attr_val:
                    href = attr_val.strip()
                    if href.startswith(("#", "javascript:", "mailto:", "tel:", "data:")):
                        continue
                    full_url = urljoin(self.current_page_url, href)
                    parsed = urlparse(full_url)
                    if parsed.scheme in ("http", "https"):
                        host = parsed.netloc.lower()
                        # Match host or www variant
                        if host == self.base_domain or host.replace("www.", "") == self.base_domain.replace("www.", ""):
                            # Strip fragments and query params to keep clean canonical paths
                            clean_link = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
                            # Exclude media / binary files
                            if not re.search(r'\.(pdf|png|jpg|jpeg|gif|svg|webp|ico|mp4|mp3|zip|gz|tar|css|js|json|xml)$', parsed.path, re.IGNORECASE):
                                self.internal_links.add(clean_link)


def chunk_text(text: str, max_chunk_size: int = 1200, overlap: int = 150) -> list[str]:
    """Split text into coherent semantic chunks preserving sentence boundaries."""
    sentences = re.split(r'(?<=[.!?\n])\s+', text)
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        sentence_len = len(sentence)
        if current_length + sentence_len > max_chunk_size and current_chunk:
            chunk_str = " ".join(current_chunk)
            chunks.append(chunk_str)
            overlap_sentences = []
            overlap_len = 0
            for s in reversed(current_chunk):
                if overlap_len + len(s) < overlap:
                    overlap_sentences.insert(0, s)
                    overlap_len += len(s)
                else:
                    break
            current_chunk = overlap_sentences + [sentence]
            current_length = sum(len(s) for s in current_chunk) + len(current_chunk)
        else:
            current_chunk.append(sentence)
            current_length += sentence_len + 1

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


async def crawl_and_index_url(
    db: AsyncSession,
    company_id: int,
    url: str,
    product_id: int | None = None,
    api_key: str | None = None,
    crawl_mode: str = "single",
    max_pages: int = 15,
) -> dict:
    """
    Crawls web pages.
    - If crawl_mode == "single": Crawls the exact URL provided.
    - If crawl_mode == "deep": Recursively discovers and crawls internal pages up to max_pages.
    """
    clean_url = url.strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = f"https://{clean_url}"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    base_domain = urlparse(clean_url).netloc.lower()
    urls_to_visit = [clean_url.rstrip("/")]
    visited_urls = set()
    total_chunks_created = 0
    total_characters = 0
    pages_indexed = []

    limit = 1 if crawl_mode != "deep" else min(max(max_pages, 1), 50)

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True, headers=headers) as client:
        # Optional: check if sitemap exists for deep crawl
        if crawl_mode == "deep":
            try:
                sitemap_url = f"{clean_url.rstrip('/')}/sitemap.xml"
                sm_resp = await client.get(sitemap_url)
                if sm_resp.status_code == 200 and "<loc>" in sm_resp.text:
                    locs = re.findall(r'<loc>(https?://[^<]+)</loc>', sm_resp.text)
                    for loc in locs:
                        parsed_loc = urlparse(loc)
                        if parsed_loc.netloc.lower() == base_domain and loc not in urls_to_visit:
                            urls_to_visit.append(loc.rstrip("/"))
            except Exception as sm_err:
                logger.debug(f"Sitemap check skipped: {sm_err}")

        while urls_to_visit and len(visited_urls) < limit:
            target_url = urls_to_visit.pop(0)
            if target_url in visited_urls:
                continue

            visited_urls.add(target_url)

            try:
                response = await client.get(target_url)
                if response.status_code != 200:
                    continue
            except httpx.HTTPError as exc:
                logger.warning(f"Failed to fetch {target_url}: {exc}")
                continue

            html_content = response.text

            # If deep crawling, discover additional internal links
            if crawl_mode == "deep" and len(visited_urls) < limit:
                link_extractor = LinkExtractor(target_url, base_domain)
                try:
                    link_extractor.feed(html_content)
                    for internal_link in link_extractor.internal_links:
                        if internal_link not in visited_urls and internal_link not in urls_to_visit:
                            urls_to_visit.append(internal_link)
                except Exception as parse_err:
                    logger.debug(f"Link extraction error on {target_url}: {parse_err}")

            # Extract clean text
            parser = WebpageTextExtractor()
            try:
                parser.feed(html_content)
            except Exception as text_err:
                logger.debug(f"Text parsing error on {target_url}: {text_err}")
                continue

            full_text = " ".join(parser.text_chunks)
            full_text = re.sub(r'\s+', ' ', full_text).strip()

            if len(full_text) < 40:
                continue

            title = parser.title or target_url
            chunks = chunk_text(full_text, max_chunk_size=1000, overlap=120)

            for chunk in chunks:
                formatted_content = f"[Source: {title} | {target_url}]\n{chunk}"
                try:
                    embedding = await create_embedding(formatted_content, api_key=api_key)
                except Exception as embed_err:
                    logger.warning(f"Could not generate embedding for crawled chunk: {embed_err}. Using fallback.")
                    embedding = [0.0] * 1536

                knowledge_entry = ProductKnowledge(
                    company_id=company_id,
                    product_id=product_id,
                    content=formatted_content,
                    embedding=embedding,
                )
                db.add(knowledge_entry)
                total_chunks_created += 1

            total_characters += len(full_text)
            pages_indexed.append({"url": target_url, "title": title, "chunks": len(chunks)})

    if total_chunks_created == 0:
        raise ValueError(f"Could not extract readable text content from {clean_url}. The website may use client-side rendering or block automated scrapers.")

    # Update company last_crawled_at timestamp
    try:
        from app.models.company import Company
        from datetime import datetime
        res_comp = await db.execute(select(Company).where(Company.id == company_id))
        comp = res_comp.scalar_one_or_none()
        if comp:
            comp.last_crawled_at = datetime.utcnow()
    except Exception:
        pass

    await db.commit()

    return {
        "url": clean_url,
        "title": pages_indexed[0]["title"] if pages_indexed else clean_url,
        "crawl_mode": crawl_mode,
        "pages_crawled": len(pages_indexed),
        "pages_list": [p["url"] for p in pages_indexed],
        "chunks_indexed": total_chunks_created,
        "total_characters": total_characters,
    }


async def run_scheduled_crawls(db: AsyncSession) -> list[dict]:
    """Scans all companies with auto_crawl_enabled and triggers deep crawls for overdue websites."""
    from app.models.company import Company
    from datetime import datetime, timedelta

    res = await db.execute(
        select(Company).where(
            Company.auto_crawl_enabled == True,
            Company.website != None,
            Company.is_active == True,
        )
    )
    companies = res.scalars().all()
    results = []
    now = datetime.utcnow()

    for comp in companies:
        if not comp.website:
            continue
        freq_days = comp.crawl_frequency_days or 7
        is_overdue = (comp.last_crawled_at is None) or (now - comp.last_crawled_at > timedelta(days=freq_days))

        if is_overdue:
            try:
                crawl_res = await crawl_and_index_url(
                    db=db,
                    company_id=comp.id,
                    url=comp.website,
                    api_key=comp.llm_api_key,
                    crawl_mode="deep",
                    max_pages=15,
                )
                results.append({"company_id": comp.id, "status": "crawled", "pages": crawl_res["pages_crawled"]})
            except Exception as e:
                results.append({"company_id": comp.id, "status": "error", "detail": str(e)})

    return results

