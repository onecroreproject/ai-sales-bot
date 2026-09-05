from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.models.chat_session import ChatSession
from app.schemas.lead import LeadCreate, LeadUpdate


# ---------------------------------------------------------
# CREATE LEAD
# ---------------------------------------------------------
async def create_lead(
    db: AsyncSession,
    lead_data: LeadCreate,
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.company_id == lead_data.company_id,
            ChatSession.session_id == lead_data.session_id,
        )
    )
    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    lead = Lead(
        company_id=lead_data.company_id,
        session_id=session.id,
        name=lead_data.name,
        email=lead_data.email,
        phone=lead_data.phone,
        company_name=lead_data.company_name,
        requirement=lead_data.requirement,
        status="new",
    )

    try:
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create lead",
        )

    return lead


# ---------------------------------------------------------
# GET LEADS
# ---------------------------------------------------------
async def get_leads(
    db: AsyncSession,
    company_id: int,
):
    try:
        result = await db.execute(
            select(Lead)
            .where(Lead.company_id == company_id)
            .order_by(Lead.created_at.desc())
        )
        return result.scalars().all()

    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leads",
        )


async def get_lead(
    db: AsyncSession,
    lead_id: int,
    company_id: int,
):
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.company_id == company_id,
        )
    )
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    return lead


# ---------------------------------------------------------
# UPDATE LEAD
# ---------------------------------------------------------
async def update_lead(
    db: AsyncSession,
    lead_id: int,
    company_id: int,
    lead_data: LeadUpdate,
):
    lead = await get_lead(db, lead_id, company_id)

    update_data = lead_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    try:
        await db.commit()
        await db.refresh(lead)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update lead",
        )

    return lead


# ---------------------------------------------------------
# DELETE LEAD
# ---------------------------------------------------------
async def delete_lead(
    db: AsyncSession,
    lead_id: int,
    company_id: int,
) -> bool:
    lead = await get_lead(db, lead_id, company_id)

    try:
        await db.delete(lead)
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete lead",
        )

    return True