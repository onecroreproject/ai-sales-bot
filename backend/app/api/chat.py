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


@router.get("/conversations")
async def get_conversations_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all visitor conversations, questions asked, answers given, and origin location."""
    from sqlalchemy import select
    from app.models.chat_session import ChatSession
    from app.models.chat_message import ChatMessage
    from app.models.lead import Lead

    # Query all sessions for current company
    res_sessions = await db.execute(
        select(ChatSession)
        .where(ChatSession.company_id == current_user.company_id)
        .order_by(ChatSession.created_at.desc())
    )
    sessions = res_sessions.scalars().all()

    conversations = []
    for s in sessions:
        # Load messages
        res_msgs = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == s.id)
            .order_by(ChatMessage.created_at.asc())
        )
        msgs = res_msgs.scalars().all()

        # Check if lead captured
        res_lead = await db.execute(
            select(Lead).where(
                Lead.company_id == current_user.company_id,
                Lead.session_id == s.id,
            )
        )
        lead = res_lead.scalar_one_or_none()

        conversations.append({
            "id": s.id,
            "session_id": s.session_id,
            "mode": getattr(s, "mode", "ai") or "ai",
            "origin_domain": s.origin_domain or "Direct / Embed Widget",
            "location": s.location or "Online Visitor",
            "ip_address": s.ip_address or "Unknown IP",
            "user_agent": s.user_agent,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": (s.updated_at or s.created_at).isoformat() if (s.updated_at or s.created_at) else None,
            "message_count": len(msgs),
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in msgs
            ],
            "lead": {
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "company_name": lead.company_name,
                "requirement": lead.requirement,
            } if lead else None,
        })

    return conversations


from pydantic import BaseModel, Field
from datetime import datetime

class AgentReplyRequest(BaseModel):
    content: str = Field(..., min_length=1)

class ConversationModeRequest(BaseModel):
    mode: str = Field(..., pattern="^(ai|human)$")


@router.post("/conversations/{session_id}/reply")
async def send_agent_reply_api(
    session_id: str,
    payload: AgentReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Company support agent takes over conversation and replies directly to visitor."""
    from sqlalchemy import select
    from app.models.chat_session import ChatSession
    from app.models.chat_message import ChatMessage

    res = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.company_id == current_user.company_id,
        )
    )
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    # Create message with role 'agent'
    new_msg = ChatMessage(
        session_id=session.id,
        role="agent",
        content=payload.content.strip(),
    )
    db.add(new_msg)
    session.mode = "human"
    session.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(new_msg)

    return {
        "id": new_msg.id,
        "session_id": session_id,
        "role": new_msg.role,
        "content": new_msg.content,
        "mode": session.mode,
        "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
    }


@router.post("/conversations/{session_id}/mode")
async def set_conversation_mode_api(
    session_id: str,
    payload: ConversationModeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle between 'ai' and 'human' takeover mode for a conversation."""
    from sqlalchemy import select
    from app.models.chat_session import ChatSession

    res = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.company_id == current_user.company_id,
        )
    )
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    session.mode = payload.mode
    session.updated_at = datetime.utcnow()
    await db.commit()

    return {"session_id": session_id, "mode": session.mode}


@router.delete("/conversations/{session_id}")
async def delete_conversation_api(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation session and all its messages."""
    from sqlalchemy import select, delete
    from app.models.chat_session import ChatSession
    from app.models.chat_message import ChatMessage

    res = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.company_id == current_user.company_id,
        )
    )
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    await db.execute(delete(ChatMessage).where(ChatMessage.session_id == session.id))
    await db.execute(delete(ChatSession).where(ChatSession.id == session.id))
    await db.commit()

    return {"message": "Conversation successfully deleted"}