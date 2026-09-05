from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


async def create_product(
    db: AsyncSession,
    product_data: ProductCreate,
) -> Product:

    product = Product(
        company_id=product_data.company_id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        features=product_data.features,
        benefits=product_data.benefits,
        target_customer=product_data.target_customer,
    )

    db.add(product)

    try:
        await db.commit()
        await db.refresh(product)
    except Exception:
        await db.rollback()
        raise

    return product


async def get_products(
    db: AsyncSession,
    company_id: int,
):
    result = await db.execute(
        select(Product)
        .where(Product.company_id == company_id)
        .order_by(Product.id.desc())
    )
    return result.scalars().all()


async def get_product(
    db: AsyncSession,
    product_id: int,
    company_id: int,
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.company_id == company_id,
        )
    )
    return result.scalar_one_or_none()


async def update_product(
    db: AsyncSession,
    product_id: int,
    company_id: int,
    product_data: ProductUpdate,
) -> Product:
    product = await get_product(db, product_id, company_id)
    if product is None:
        raise ValueError("Product not found for this company")

    update_dict = product_data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(product, field, val)

    try:
        await db.commit()
        await db.refresh(product)
    except Exception:
        await db.rollback()
        raise

    return product


async def delete_product(
    db: AsyncSession,
    product_id: int,
    company_id: int,
) -> bool:
    product = await get_product(db, product_id, company_id)
    if product is None:
        raise ValueError("Product not found for this company")

    try:
        await db.delete(product)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return True