from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard_service import get_dashboard_stats, get_super_admin_stats

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard Analytics"],
)


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
)
async def get_dashboard_stats_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve aggregated dashboard KPI metrics for current company."""
    return await get_dashboard_stats(db, current_user.company_id)


@router.get(
    "/super-admin",
)
async def get_super_admin_stats_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve platform-wide overview stats across all companies for Super Admin view."""
    return await get_super_admin_stats(db)
