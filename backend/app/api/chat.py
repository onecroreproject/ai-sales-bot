from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat
from app.core.dependencies import get_current_user
from app.models.user import User
from app.ai.llm import AIServiceError


router = APIRouter(
    prefix="/api/v1/chat",
    tags=["Chat"],
)


@router.post(
    "",
    response_model=ChatResponse,
)
async def chat_api(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ---------------------------------------------------------
    # COMPANY AUTHORIZATION
    # ---------------------------------------------------------
    if request.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another company's chat",
        )

    # ---------------------------------------------------------
    # CHAT
    # ---------------------------------------------------------
    try:
        answer = await chat(
            db=db,
            company_id=current_user.company_id,
            session_id=request.session_id,
            message=request.message,
        )
    except AIServiceError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------
    return ChatResponse(
        session_id=request.session_id,
        answer=answer.answer,
    )