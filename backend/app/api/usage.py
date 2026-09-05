from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.usage import UsageSummaryResponse
from app.services.usage_service import get_company_usage_summary

router = APIRouter(
    prefix="/api/v1/usage",
    tags=["Usage Analytics"],
)


@router.get(
    "/summary",
    response_model=UsageSummaryResponse,
)
async def get_usage_summary_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve total LLM token usage and cost metrics for the current company."""
    return await get_company_usage_summary(db, current_user.company_id)
