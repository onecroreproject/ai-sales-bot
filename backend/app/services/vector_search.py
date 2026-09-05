from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product_knowledge import ProductKnowledge


async def search_knowledge(
    db: AsyncSession,
    company_id: int,
    query_embedding: list[float],
    limit: int = 3,
):
    """Asynchronously query top matching ProductKnowledge entries using pgvector cosine distance."""
    statement = (
        select(ProductKnowledge)
        .where(ProductKnowledge.company_id == company_id)
        .order_by(ProductKnowledge.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )

    result = await db.execute(statement)
    return result.scalars().all()