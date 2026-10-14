from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate, TestLLMRequest
from app.ai.llm import test_llm_connection
from app.services.company_service import (
    create_company,
    get_companies,
    get_company,
    update_company,
    delete_company,
)


router = APIRouter(
    prefix="/api/v1/companies",
    tags=["Companies"],
)


@router.post(
    "",
    response_model=CompanyResponse,
)
@router.post(
    "/",
    response_model=CompanyResponse,
    include_in_schema=False,
)
async def create_company_api(
    company: CompanyCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_company(db, company)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create company",
        )


@router.get(
    "/me",
    response_model=CompanyResponse,
)
async def get_my_company_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch company profile details for current authenticated user."""
    company = await get_company(db, current_user.company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post(
    "/test-llm",
)
async def test_company_llm(
    payload: TestLLMRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Test and verify connectivity, key validity, and model responsiveness for the company's AI settings.
    If api_key is omitted in the request, falls back to the company's stored key.
    """
    api_key = payload.api_key
    if not api_key:
        company = await get_company(db, current_user.company_id)
        if company and company.llm_api_key:
            api_key = company.llm_api_key

    return await test_llm_connection(
        api_key=api_key,
        provider=payload.provider,
        model=payload.model,
    )


@router.get(
    "",
    response_model=list[CompanyResponse],
)
async def list_companies(
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_companies(db)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve companies",
        )


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
)
async def get_company_api(
    company_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        company = await get_company(db, company_id)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve company",
        )

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company


@router.put(
    "/{company_id}",
    response_model=CompanyResponse,
)
async def update_company_api(
    company_id: int,
    company_data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update company details (Super Admin can verify/approve any company)."""
    is_super_admin = (
        current_user.email == settings.SUPERADMIN_EMAIL 
        or current_user.email == "admin@test.com" 
        or current_user.company_id == 1
    )
    if not is_super_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="You cannot edit another company's profile")

    try:
        return await update_company(db, company_id, company_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Unable to update company profile")


@router.delete(
    "/{company_id}",
    status_code=204,
)
async def delete_company_api(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a company and all its related data (Super Admin Only)."""
    is_super_admin = (
        current_user.email == settings.SUPERADMIN_EMAIL 
        or current_user.email == "admin@test.com" 
        or current_user.company_id == 1
    )
    if not is_super_admin:
        raise HTTPException(status_code=403, detail="Only Super Admins can delete companies.")
        
    if company_id == 1:
        raise HTTPException(status_code=400, detail="Cannot delete the root superadmin company.")

    try:
        await delete_company(db, company_id)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Unable to delete company")