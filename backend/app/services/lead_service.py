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
    session_db_id = None
    if lead_data.session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.company_id == lead_data.company_id,
                ChatSession.session_id == lead_data.session_id,
            )
        )
        session = result.scalar_one_or_none()
        if session:
            session_db_id = session.id

    lead = Lead(
        company_id=lead_data.company_id,
        session_id=session_db_id,
        name=lead_data.name,
        email=lead_data.email,
        phone=lead_data.phone,
        company_name=lead_data.company_name,
        requirement=lead_data.requirement,
        status=lead_data.status or "new",
        sentiment=lead_data.sentiment or "Warm",
        intent_score=lead_data.intent_score or 50,
        notes=lead_data.notes,
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

    # ---------------------------------------------------------
    # MULTI-CHANNEL WEBHOOK DISPATCH (HubSpot, Zapier, Make, CRM)
    # ---------------------------------------------------------
    try:
        from app.models.company import Company
        import httpx
        import asyncio

        res_comp = await db.execute(select(Company).where(Company.id == lead.company_id))
        comp = res_comp.scalar_one_or_none()
        if comp and comp.webhook_url:
            async def _post_webhook(url: str, payload: dict):
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        await client.post(url, json=payload)
                except Exception:
                    pass

            webhook_payload = {
                "event": "lead.created",
                "lead_id": lead.id,
                "company_id": lead.company_id,
                "company_name": comp.name,
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "prospect_company": lead.company_name,
                "requirement": lead.requirement,
                "sentiment": lead.sentiment,
                "intent_score": lead.intent_score,
                "created_at": lead.created_at.isoformat() if lead.created_at else None,
            }
            asyncio.create_task(_post_webhook(comp.webhook_url, webhook_payload))
    except Exception:
        pass

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
            select(Lead, ChatSession.location, ChatSession.origin_domain)
            .outerjoin(ChatSession, Lead.session_id == ChatSession.id)
            .where(Lead.company_id == company_id)
            .order_by(Lead.created_at.desc())
        )
        rows = result.all()
        leads_list = []
        for lead, loc, domain in rows:
            lead_dict = {
                "id": lead.id,
                "company_id": lead.company_id,
                "session_id": lead.session_id,
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "company_name": lead.company_name,
                "requirement": lead.requirement,
                "status": lead.status,
                "sentiment": getattr(lead, "sentiment", "Warm") or "Warm",
                "intent_score": getattr(lead, "intent_score", 50) or 50,
                "notes": getattr(lead, "notes", None),
                "created_at": lead.created_at,
                "location": loc or "Online Visitor",
                "origin_domain": domain or "Direct / Widget",
            }
            leads_list.append(lead_dict)
        return leads_list

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
        select(Lead, ChatSession.location, ChatSession.origin_domain)
        .outerjoin(ChatSession, Lead.session_id == ChatSession.id)
        .where(
            Lead.id == lead_id,
            Lead.company_id == company_id,
        )
    )
    row = result.first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    lead, loc, domain = row
    return {
        "id": lead.id,
        "company_id": lead.company_id,
        "session_id": lead.session_id,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "company_name": lead.company_name,
        "requirement": lead.requirement,
        "status": lead.status,
        "sentiment": getattr(lead, "sentiment", "Warm") or "Warm",
        "intent_score": getattr(lead, "intent_score", 50) or 50,
        "notes": getattr(lead, "notes", None),
        "created_at": lead.created_at,
        "location": loc or "Online Visitor",
        "origin_domain": domain or "Direct / Widget",
    }


# ---------------------------------------------------------
# UPDATE LEAD
# ---------------------------------------------------------
async def update_lead(
    db: AsyncSession,
    lead_id: int,
    company_id: int,
    lead_data: LeadUpdate,
):
    # Fetch ORM lead instance directly
    res = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.company_id == company_id,
        )
    )
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

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

    # Return enriched representation
    return await get_lead(db, lead_id, company_id)


# ---------------------------------------------------------
# DELETE LEAD
# ---------------------------------------------------------
async def delete_lead(
    db: AsyncSession,
    lead_id: int,
    company_id: int,
) -> bool:
    res = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.company_id == company_id,
        )
    )
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

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