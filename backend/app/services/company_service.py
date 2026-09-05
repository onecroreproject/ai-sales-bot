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