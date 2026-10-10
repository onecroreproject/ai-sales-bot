from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import create_embedding
from app.models.product_knowledge import ProductKnowledge
from app.services.company_service import get_company
from app.core.config import settings


async def search_knowledge(
    db: AsyncSession,
    company_id: int,
    query: str,
    limit: int = 5,
):
    company = await get_company(db, company_id)
    api_key = company.llm_api_key if company else settings.OPENAI_API_KEY
    query_embedding = await create_embedding(query, api_key=api_key)

    stmt = (
        select(ProductKnowledge)
        .where(ProductKnowledge.company_id == company_id)
        .order_by(ProductKnowledge.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )

    res = await db.execute(stmt)
    return res.scalars().all()