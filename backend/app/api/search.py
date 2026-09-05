from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.search import SearchRequest, SearchResult
from app.services.search_service import search_knowledge
from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/api/v1/search",
    tags=["Search"],
)


@router.post(
    "",
    response_model=list[SearchResult],
)
async def search_api(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot search another company's knowledge",
        )

    return await search_knowledge(
        db=db,
        company_id=current_user.company_id,
        query=request.query,
        limit=request.limit,
    )