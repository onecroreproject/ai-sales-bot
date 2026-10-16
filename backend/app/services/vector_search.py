from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product_knowledge import ProductKnowledge


async def search_knowledge(
    db: AsyncSession,
    company_id: int,
    query_embedding: list[float] | None = None,
    limit: int = 3,
):
    """Query top matching ProductKnowledge entries using pgvector cosine distance, or fallback to text search."""
    if query_embedding:
        try:
            statement = (
                select(ProductKnowledge)
                .where(ProductKnowledge.company_id == company_id)
                .order_by(ProductKnowledge.embedding.cosine_distance(query_embedding))
                .limit(limit)
            )
            result = await db.execute(statement)
            items = result.scalars().all()
            if items:
                return items
        except Exception:
            pass

    # Fallback to general recent knowledge for company
    statement = (
        select(ProductKnowledge)
        .where(ProductKnowledge.company_id == company_id)
        .order_by(ProductKnowledge.id.desc())
        .limit(limit)
    )
    result = await db.execute(statement)
    return result.scalars().all()


async def search_knowledge_keyword(
    db: AsyncSession,
    company_id: int,
    query: str,
    limit: int = 3,
):
    """Keyword search fallback across title and content."""
    keywords = [k.strip() for k in query.split() if len(k.strip()) > 3]
    if not keywords:
        statement = (
            select(ProductKnowledge)
            .where(ProductKnowledge.company_id == company_id)
            .order_by(ProductKnowledge.id.desc())
            .limit(limit)
        )
    else:
        conditions = []
        for kw in keywords[:3]:
            conditions.append(ProductKnowledge.content.ilike(f"%{kw}%"))
            conditions.append(ProductKnowledge.title.ilike(f"%{kw}%"))

        statement = (
            select(ProductKnowledge)
            .where(ProductKnowledge.company_id == company_id, or_(*conditions))
            .limit(limit)
        )

    result = await db.execute(statement)
    return result.scalars().all()