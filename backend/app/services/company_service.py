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
    from sqlalchemy import delete
    from app.models.user import User
    from app.models.product import Product
    from app.models.lead import Lead
    from app.models.knowledge import Knowledge
    from app.models.widget import WidgetConfig

    try:
        await db.execute(delete(User).where(User.company_id == company_id))
        await db.execute(delete(Product).where(Product.company_id == company_id))
        await db.execute(delete(Lead).where(Lead.company_id == company_id))
        await db.execute(delete(Knowledge).where(Knowledge.company_id == company_id))
        await db.execute(delete(WidgetConfig).where(WidgetConfig.company_id == company_id))
        
        await db.execute(delete(Company).where(Company.id == company_id))
        await db.commit()
    except Exception:
        await db.rollback()
        raise