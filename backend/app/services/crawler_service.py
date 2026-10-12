import re
import httpx
from html.parser import HTMLParser
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
        # Ignore script, style, nav, footer, etc.
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
            # Retain overlap sentences
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
) -> dict:
    """
    Crawls a public web page, extracts clean text, splits into semantic chunks,
    generates 1536-dimension embeddings, and persists to ProductKnowledge.
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

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True, headers=headers) as client:
        try:
            response = await client.get(clean_url)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error(f"Failed to crawl URL {clean_url}: {exc}")
            raise ValueError(f"Unable to access {clean_url}: {str(exc)}")

    html_content = response.text
    parser = WebpageTextExtractor()
    parser.feed(html_content)

    full_text = " ".join(parser.text_chunks)
    # Normalize multiple whitespace
    full_text = re.sub(r'\s+', ' ', full_text).strip()

    if len(full_text) < 40:
        raise ValueError(f"The webpage at {clean_url} did not contain enough readable text content.")

    title = parser.title or clean_url

    chunks = chunk_text(full_text, max_chunk_size=1000, overlap=120)
    created_count = 0

    for chunk in chunks:
        formatted_content = f"[Source: {title} | {clean_url}]\n{chunk}"
        embedding = await create_embedding(formatted_content, api_key=api_key)

        knowledge_entry = ProductKnowledge(
            company_id=company_id,
            product_id=product_id,
            content=formatted_content,
            embedding=embedding,
        )
        db.add(knowledge_entry)
        created_count += 1

    await db.commit()

    return {
        "url": clean_url,
        "title": title,
        "chunks_indexed": created_count,
        "total_characters": len(full_text),
    }
