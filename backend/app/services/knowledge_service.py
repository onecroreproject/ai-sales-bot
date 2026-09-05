from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import create_embedding
from app.models.product import Product
from app.models.product_knowledge import ProductKnowledge
from app.schemas.knowledge import KnowledgeCreate, KnowledgeUpdate


async def create_knowledge(
    db: AsyncSession,
    knowledge_data: KnowledgeCreate,
) -> ProductKnowledge:

    if knowledge_data.product_id is not None:
        result = await db.execute(
            select(Product).where(
                Product.id == knowledge_data.product_id,
                Product.company_id == knowledge_data.company_id,
            )
        )
        product = result.scalar_one_or_none()
        if product is None:
            raise ValueError("Product not found for this company")

    embedding = await create_embedding(knowledge_data.content)

    knowledge = ProductKnowledge(
        company_id=knowledge_data.company_id,
        product_id=knowledge_data.product_id,
        content=knowledge_data.content,
        embedding=embedding,
    )

    db.add(knowledge)

    try:
        await db.commit()
        await db.refresh(knowledge)
    except Exception:
        await db.rollback()
        raise

    return knowledge


async def get_knowledge(
    db: AsyncSession,
    company_id: int,
    product_id: int | None = None,
):
    stmt = select(ProductKnowledge).where(
        ProductKnowledge.company_id == company_id
    )

    if product_id is not None:
        stmt = stmt.where(ProductKnowledge.product_id == product_id)

    res = await db.execute(stmt)
    return res.scalars().all()


async def get_single_knowledge(
    db: AsyncSession,
    knowledge_id: int,
    company_id: int,
) -> ProductKnowledge | None:
    res = await db.execute(
        select(ProductKnowledge).where(
            ProductKnowledge.id == knowledge_id,
            ProductKnowledge.company_id == company_id,
        )
    )
    return res.scalar_one_or_none()


async def update_knowledge(
    db: AsyncSession,
    knowledge_id: int,
    company_id: int,
    knowledge_data: KnowledgeUpdate,
) -> ProductKnowledge:
    knowledge = await get_single_knowledge(db, knowledge_id, company_id)
    if knowledge is None:
        raise ValueError("Knowledge entry not found for this company")

    if knowledge_data.product_id is not None:
        knowledge.product_id = knowledge_data.product_id

    if knowledge_data.content is not None and knowledge_data.content != knowledge.content:
        knowledge.content = knowledge_data.content
        knowledge.embedding = await create_embedding(knowledge_data.content)

    try:
        await db.commit()
        await db.refresh(knowledge)
    except Exception:
        await db.rollback()
        raise

    return knowledge


async def delete_knowledge(
    db: AsyncSession,
    knowledge_id: int,
    company_id: int,
) -> bool:
    knowledge = await get_single_knowledge(db, knowledge_id, company_id)
    if knowledge is None:
        raise ValueError("Knowledge entry not found for this company")

    try:
        await db.delete(knowledge)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return True