from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.widget import (
    PublicChatRequest,
    PublicChatResponse,
    PublicWidgetConfigResponse,
    WidgetConfigResponse,
    WidgetConfigUpdate,
)
from app.services.chat_service import chat
from app.services.widget_service import (
    get_or_create_widget_config,
    get_public_widget_config,
    regenerate_site_key,
    update_widget_config,
)
from app.ai.llm import AIServiceError
from app.core.rate_limit import limiter

router = APIRouter(
    prefix="/api/v1/widget",
    tags=["Widget"],
)


# =====================================================================
# ADMIN ENDPOINTS (JWT Protected)
# =====================================================================

@router.get(
    "/config",
    response_model=WidgetConfigResponse,
)
async def get_widget_config_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve widget configuration and public site key for current company."""
    return await get_or_create_widget_config(db, current_user.company_id)


@router.put(
    "/config",
    response_model=WidgetConfigResponse,
)
async def update_widget_config_api(
    request: WidgetConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update branding, bot title, greeting message, widget icon, custom icon URL, or domain whitelist."""
    return await update_widget_config(db, current_user.company_id, request)


@router.post(
    "/config/regenerate-key",
    response_model=WidgetConfigResponse,
)
async def regenerate_site_key_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Regenerate public site key for company widget."""
    return await regenerate_site_key(db, current_user.company_id)


# =====================================================================
# PUBLIC ENDPOINTS (Key Authenticated for Embedded Widgets)
# =====================================================================

@router.get(
    "/public/config/{site_key}",
    response_model=PublicWidgetConfigResponse,
)
@limiter.limit("30/minute")
async def get_public_widget_config_api(
    request: Request,
    site_key: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint to fetch widget branding and metadata for frontend embed scripts."""
    origin = request.headers.get("origin") or request.headers.get("referer")
    config, company = await get_public_widget_config(db, site_key=site_key, origin=origin)

    return PublicWidgetConfigResponse(
        site_key=config.site_key,
        company_name=company.name,
        bot_title=config.bot_title,
        greeting_message=config.greeting_message,
        primary_color=config.primary_color,
        widget_icon=config.widget_icon,
        custom_icon_url=config.custom_icon_url,
        is_enabled=config.is_enabled,
    )


@router.post(
    "/public/chat",
    response_model=PublicChatResponse,
)
@limiter.limit("10/minute")
async def public_chat_api(
    request: Request,
    payload: PublicChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint for processing messages sent from external embedded chat widgets."""
    origin = request.headers.get("origin") or request.headers.get("referer")
    config, company = await get_public_widget_config(db, site_key=payload.site_key, origin=origin)

    try:
        answer = await chat(
            db=db,
            company_id=company.id,
            session_id=payload.session_id,
            message=payload.message,
        )
    except AIServiceError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )

    return PublicChatResponse(
        session_id=payload.session_id,
        answer=answer.answer,
    )
