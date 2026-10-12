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
from app.services.company_service import get_company
from app.core.config import settings

async def chat(
    db: AsyncSession,
    company_id: int,
    session_id: str,
    message: str,
    origin_domain: str | None = None,
    ip_address: str | None = None,
    location: str | None = None,
    user_agent: str | None = None,
):
    # ---------------------------------------------------------
    # 0. Fetch Company API Key & AI Settings
    # ---------------------------------------------------------
    
    company = await get_company(db, company_id)
    if not company:
        raise ValueError("Company not found")
        
    api_key = company.llm_api_key or settings.OPENAI_API_KEY
    llm_model = getattr(company, "llm_model", None) or settings.OPENAI_MODEL
    llm_provider = getattr(company, "llm_provider", None) or "openai"

    # ---------------------------------------------------------
    # 1. Find or create chat session with location & origin
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
            origin_domain=origin_domain,
            ip_address=ip_address,
            location=location,
            user_agent=user_agent,
        )

        db.add(session)
        await db.flush()
    else:
        # Update metadata if newly available
        if origin_domain and not session.origin_domain:
            session.origin_domain = origin_domain
        if ip_address and not session.ip_address:
            session.ip_address = ip_address
        if location and (not session.location or session.location == "Online Visitor"):
            session.location = location
        if user_agent and not session.user_agent:
            session.user_agent = user_agent

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

    query_embedding = await create_embedding(message, api_key=api_key)

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
        api_key=api_key,
        model=llm_model,
        provider=llm_provider,
    )

    await record_token_usage(
        db=db,
        company_id=company_id,
        session_id=session_id,
        model=llm_model,
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