from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import create_embedding
from app.ai.llm import generate_response_with_usage
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.lead import Lead
from app.schemas.lead import LeadCreate
from app.services.vector_search import search_knowledge
from app.services.lead_service import create_lead
from app.services.usage_service import record_token_usage
from app.core.config import settings


async def chat(
    db: AsyncSession,
    company_id: int,
    session_id: str,
    message: str,
):
    # ---------------------------------------------------------
    # 1. Find or create chat session
    # ---------------------------------------------------------

    result = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.company_id == company_id,
        )
    )
    session = result.scalar_one_or_none()

    if session is None:
        session = ChatSession(
            company_id=company_id,
            session_id=session_id,
        )

        db.add(session)
        await db.flush()

    # ---------------------------------------------------------
    # 2. Load previous conversation
    # ---------------------------------------------------------

    prev_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at)
    )
    previous_messages = prev_result.scalars().all()

    history = [
        {
            "role": msg.role,
            "content": msg.content,
        }
        for msg in previous_messages
    ]

    # ---------------------------------------------------------
    # 3. Save current customer message
    # ---------------------------------------------------------

    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=message,
    )

    db.add(user_message)
    await db.flush()

    # ---------------------------------------------------------
    # 4. RAG search
    # ---------------------------------------------------------

    query_embedding = await create_embedding(message)

    results = await search_knowledge(
        db=db,
        company_id=company_id,
        query_embedding=query_embedding,
        limit=3,
    )

    context = "\n\n".join(
        result.content
        for result in results
    )

    # ---------------------------------------------------------
    # 5. Generate AI response & Track Token Usage
    # ---------------------------------------------------------

    answer, usage = await generate_response_with_usage(
        question=message,
        context=context or "No relevant product information was found.",
        history=history,
    )

    await record_token_usage(
        db=db,
        company_id=company_id,
        session_id=session_id,
        model=settings.OPENAI_MODEL,
        prompt_tokens=usage.get("prompt_tokens", 0),
        completion_tokens=usage.get("completion_tokens", 0),
    )

    # ---------------------------------------------------------
    # 6. Automatically create lead when ready
    # ---------------------------------------------------------

    if answer.lead_ready and answer.lead:

        # Check whether a lead already exists for this session
        lead_result = await db.execute(
            select(Lead).where(
                Lead.company_id == company_id,
                Lead.session_id == session.id,
            )
        )
        existing_lead = lead_result.scalar_one_or_none()

        if existing_lead is None:

            lead_data = LeadCreate(
                company_id=company_id,
                session_id=session_id,
                name=answer.lead.name,
                email=answer.lead.email,
                phone=answer.lead.phone,
                company_name=answer.lead.company_name,
                requirement=answer.lead.requirement,
            )

            await create_lead(
                db=db,
                lead_data=lead_data,
            )

    # ---------------------------------------------------------
    # 7. Save AI response
    # ---------------------------------------------------------

    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer.answer,
    )

    db.add(assistant_message)

    await db.commit()

    return answer