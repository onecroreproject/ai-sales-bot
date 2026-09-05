from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import create_embedding
from app.models.product_knowledge import ProductKnowledge


async def search_knowledge(
    db: AsyncSession,
    company_id: int,
    query: str,
    limit: int = 5,
):
    query_embedding = await create_embedding(query)

    stmt = (
        select(ProductKnowledge)
        .where(ProductKnowledge.company_id == company_id)
        .order_by(ProductKnowledge.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )

    res = await db.execute(stmt)
    return res.scalars().all()