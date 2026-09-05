from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import (
    create_product,
    get_products,
    get_product,
    update_product,
    delete_product,
)
from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/api/v1/products",
    tags=["Products"],
)


@router.post(
    "",
    response_model=ProductResponse,
)
async def create_product_api(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if product.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot create a product for another company",
        )

    try:
        return await create_product(db, product)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create product",
        )


@router.get(
    "",
    response_model=list[ProductResponse],
)
async def list_products(
    company_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if company_id is not None and company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another company's products",
        )

    try:
        return await get_products(db, current_user.company_id)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve products",
        )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
async def get_product_api(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        product = await get_product(
            db,
            product_id,
            current_user.company_id,
        )
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve product",
        )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
async def update_product_api(
    product_id: int,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update product details for current user's company."""
    try:
        return await update_product(db, product_id, current_user.company_id, product_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Unable to update product")


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_product_api(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a product belonging to current user's company."""
    try:
        await delete_product(db, product_id, current_user.company_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Unable to delete product")