from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.lead import (
    LeadCreate,
    LeadResponse,
    LeadUpdate,
)
from app.services.lead_service import (
    create_lead,
    get_leads,
    get_lead,
    update_lead,
    delete_lead,
)
from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/api/v1/leads",
    tags=["Leads"],
)


@router.post(
    "",
    response_model=LeadResponse,
)
async def create_lead_api(
    lead: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if lead.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot create a lead for another company",
        )

    try:
        return await create_lead(db, lead)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


@router.get(
    "",
    response_model=list[LeadResponse],
)
async def get_leads_api(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another company's data",
        )

    return await get_leads(db, company_id)


@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
)
async def get_lead_single_api(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single lead."""
    return await get_lead(db, lead_id, current_user.company_id)


@router.patch(
    "/{lead_id}",
    response_model=LeadResponse,
)
async def update_lead_api(
    lead_id: int,
    company_id: int,
    lead: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot update another company's lead",
        )

    try:
        return await update_lead(db, lead_id, company_id, lead)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_lead_api(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a lead record for current company."""
    await delete_lead(db, lead_id, current_user.company_id)