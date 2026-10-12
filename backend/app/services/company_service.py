from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate


async def create_company(
    db: AsyncSession,
    company_data: CompanyCreate,
) -> Company:

    company = Company(
        name=company_data.name,
        website=company_data.website,
        description=company_data.description,
        is_verified=True,
    )

    db.add(company)

    try:
        await db.commit()
        await db.refresh(company)
    except Exception:
        await db.rollback()
        raise

    return company


async def get_companies(
    db: AsyncSession,
):
    result = await db.execute(
        select(Company).order_by(Company.id.desc())
    )
    return result.scalars().all()


async def get_company(
    db: AsyncSession,
    company_id: int,
):
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    return result.scalar_one_or_none()


async def update_company(
    db: AsyncSession,
    company_id: int,
    company_data: CompanyUpdate,
) -> Company:
    company = await get_company(db, company_id)
    if company is None:
        raise ValueError("Company not found")

    update_dict = company_data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(company, field, val)

    try:
        await db.commit()
        await db.refresh(company)
    except Exception:
        await db.rollback()
        raise

    return company


async def delete_company(
    db: AsyncSession,
    company_id: int,
):
    from sqlalchemy import delete, select
    from app.models.user import User
    from app.models.product import Product
    from app.models.product_knowledge import ProductKnowledge
    from app.models.lead import Lead
    from app.models.widget_config import WidgetConfig
    from app.models.token_usage import TokenUsage
    from app.models.chat_session import ChatSession
    from app.models.chat_message import ChatMessage

    try:
        # 1. Delete chat messages for any sessions belonging to this company
        sessions_res = await db.execute(select(ChatSession.id).where(ChatSession.company_id == company_id))
        session_ids = sessions_res.scalars().all()
        if session_ids:
            await db.execute(delete(ChatMessage).where(ChatMessage.session_id.in_(session_ids)))

        # 2. Delete child tables
        await db.execute(delete(ChatSession).where(ChatSession.company_id == company_id))
        await db.execute(delete(TokenUsage).where(TokenUsage.company_id == company_id))
        await db.execute(delete(ProductKnowledge).where(ProductKnowledge.company_id == company_id))
        await db.execute(delete(Product).where(Product.company_id == company_id))
        await db.execute(delete(Lead).where(Lead.company_id == company_id))
        await db.execute(delete(WidgetConfig).where(WidgetConfig.company_id == company_id))
        await db.execute(delete(User).where(User.company_id == company_id))

        # 3. Delete company record
        await db.execute(delete(Company).where(Company.id == company_id))
        await db.commit()
    except Exception:
        await db.rollback()
        raise