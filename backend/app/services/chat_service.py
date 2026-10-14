from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import create_embedding
from app.ai.llm import generate_response_with_usage, SalesAssistantResponse
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.lead import Lead
from app.models.unanswered_query import UnansweredQuery
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
    bot_persona = getattr(company, "bot_persona", "professional") or "professional"
    custom_instructions = getattr(company, "custom_instructions", None)

    guardrails_config = {
        "blocked_topics": getattr(company, "guardrail_blocked_topics", None),
        "competitors": getattr(company, "guardrail_competitors", None),
        "pii_masking": getattr(company, "guardrail_pii_masking", True),
        "custom_refusal": getattr(company, "guardrail_custom_refusal", None),
        "tone_strictness": getattr(company, "guardrail_tone_strictness", "standard"),
    }

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
            mode="ai",
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
    # 2. Check for Live Human Takeover Mode or Handover Request
    # ---------------------------------------------------------
    session_mode = getattr(session, "mode", "ai") or "ai"

    # Auto-detect intent to speak with a human
    lower_msg = message.lower().strip()
    human_handover_phrases = [
        "talk to a human", "talk to human", "speak to human", "speak with human",
        "speak to a human", "talk to an agent", "talk to agent", "connect me to a representative",
        "speak to representative", "transfer to human", "real person", "human agent",
        "human support", "talk to representative", "contact person", "live agent"
    ]
    wants_human = any(phrase in lower_msg for phrase in human_handover_phrases)

    if wants_human and session_mode != "human":
        session.mode = "human"
        session.updated_at = datetime.utcnow()
        session_mode = "human"

    if session_mode == "human":
        # Check if an agent has ever replied to this session
        res_agent_msg = await db.execute(
            select(ChatMessage).where(
                ChatMessage.session_id == session.id,
                ChatMessage.role == "agent",
            )
        )
        has_agent_replied = res_agent_msg.scalars().first() is not None

        # Check if visitor already provided their email in this session
        res_lead = await db.execute(
            select(Lead).where(
                Lead.company_id == company_id,
                Lead.session_id == session.id,
            )
        )
        existing_lead = res_lead.scalar_one_or_none()

        # If an agent is already active in the session, continue waiting for agent replies
        if has_agent_replied:
            user_message = ChatMessage(
                session_id=session.id,
                role="user",
                content=message,
            )
            db.add(user_message)
            session.updated_at = datetime.utcnow()
            await db.commit()

            return SalesAssistantResponse(
                answer="Your message has been sent directly to the specialist assisting you. They will reply shortly.",
                lead_ready=False,
                lead=None,
            )

        # -------------------------------------------------------------
        # SMART OFFLINE FALLBACK: No live agent has joined yet
        # -------------------------------------------------------------
        # Check if the user is providing an email or contact in this message
        import re
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', message)
        phone_match = re.search(r'(\+?\d[\d\s\-\(\)]{7,}\d)', message)

        if email_match or phone_match:
            captured_email = email_match.group(0) if email_match else (existing_lead.email if existing_lead else None)
            captured_phone = phone_match.group(0) if phone_match else (existing_lead.phone if existing_lead else None)

            if existing_lead:
                if captured_email and not existing_lead.email:
                    existing_lead.email = captured_email
                if captured_phone and not existing_lead.phone:
                    existing_lead.phone = captured_phone
            else:
                lead_data = LeadCreate(
                    company_id=company_id,
                    session_id=session_id,
                    email=captured_email,
                    phone=captured_phone,
                    requirement=message,
                    sentiment="Hot",
                    intent_score=90,
                    notes="Visitor requested human representative while team was offline.",
                )
                await create_lead(db=db, lead_data=lead_data)

            # Revert session mode to AI so visitor can continue asking questions
            session.mode = "ai"
            session.updated_at = datetime.utcnow()

            user_message = ChatMessage(session_id=session.id, role="user", content=message)
            db.add(user_message)
            await db.commit()

            return SalesAssistantResponse(
                answer=f"Thank you! Your contact details ({captured_email or captured_phone}) have been prioritized for our team. A representative will reach out to you directly.\n\nIn the meantime, feel free to ask me anything about our products, pricing, or solutions!",
                lead_ready=False,
                lead=None,
            )

        # If visitor just requested a human and hasn't left an email yet:
        user_message = ChatMessage(session_id=session.id, role="user", content=message)
        db.add(user_message)
        session.updated_at = datetime.utcnow()
        await db.commit()

        if existing_lead and existing_lead.email:
            return SalesAssistantResponse(
                answer=f"Our live sales specialists are currently away from their desks. We have your email ({existing_lead.email}) on file and our team will follow up with you as a priority.\n\nMeanwhile, I'm here 24/7! What questions can I answer for you right now?",
                lead_ready=False,
                lead=None,
            )
        else:
            return SalesAssistantResponse(
                answer="Our live representatives are currently offline or assisting other clients.\n\n👉 **Please share your email address or phone number below**, and our team will get in touch with you directly.\n\nYou can also continue chatting with me—I can assist with all product details, pricing, and technical questions!",
                lead_ready=False,
                lead=None,
            )



    # ---------------------------------------------------------
    # 3. Load previous conversation
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
    # 4. Save current customer message & commit immediately
    # ---------------------------------------------------------

    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=message,
    )

    db.add(user_message)
    session.updated_at = datetime.utcnow()
    await db.commit()

    # ---------------------------------------------------------
    # 5. RAG search
    # ---------------------------------------------------------

    try:
        embedding_key = api_key if (llm_provider == "openai" and api_key and api_key.startswith("sk-")) else settings.OPENAI_API_KEY
        query_embedding = await create_embedding(message, api_key=embedding_key)
        results = await search_knowledge(
            db=db,
            company_id=company_id,
            query_embedding=query_embedding,
            limit=3,
        )
        context = "\n\n".join(result.content for result in results)
    except Exception:
        context = ""

    # ---------------------------------------------------------
    # 6. Generate AI response & Track Token Usage
    # ---------------------------------------------------------

    try:
        answer, usage = await generate_response_with_usage(
            question=message,
            context=context or "No relevant product information was found.",
            history=history,
            api_key=api_key,
            model=llm_model,
            provider=llm_provider,
            persona=bot_persona,
            custom_instructions=custom_instructions,
            guardrails=guardrails_config,
        )

        await record_token_usage(
            db=db,
            company_id=company_id,
            session_id=session_id,
            model=llm_model,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
        )
    except Exception:
        # Graceful fallback: Visitor message is preserved, support can take over
        answer = SalesAssistantResponse(
            answer="Thank you for reaching out! A live representative has received your message and will follow up shortly.",
            lead_ready=False,
            lead=None,
        )

    # ---------------------------------------------------------
    # 7. Check & Log Unanswered Query for Company Gaps (Phase 3)
    # ---------------------------------------------------------
    lower_ans = answer.answer.lower()
    insufficient_signals = [
        "no relevant product information",
        "insufficient",
        "don't have enough information",
        "do not have enough information",
        "cannot find information",
        "i don't have information",
        "not mentioned in the product information",
    ]
    is_unanswered = (not context or "No relevant product information was found" in context) and any(
        s in lower_ans for s in insufficient_signals
    )

    if is_unanswered:
        try:
            # Check if this question was already logged recently
            existing_unanswered = await db.execute(
                select(UnansweredQuery).where(
                    UnansweredQuery.company_id == company_id,
                    UnansweredQuery.question == message,
                    UnansweredQuery.status == "pending",
                )
            )
            if not existing_unanswered.scalar_one_or_none():
                db.add(
                    UnansweredQuery(
                        company_id=company_id,
                        session_id=session_id,
                        question=message,
                        ai_response=answer.answer,
                        status="pending",
                    )
                )
        except Exception:
            pass

    # ---------------------------------------------------------
    # 8. Automatically create lead when ready
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
                sentiment=getattr(answer.lead, "sentiment", None) or answer.customer_sentiment or "Warm",
                intent_score=getattr(answer.lead, "intent_score", None) or answer.intent_score or 75,
                notes=getattr(answer.lead, "notes", None),
            )

            await create_lead(
                db=db,
                lead_data=lead_data,
            )


    # ---------------------------------------------------------
    # 9. Save AI response
    # ---------------------------------------------------------

    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer.answer,
    )

    db.add(assistant_message)
    session.updated_at = datetime.utcnow()

    await db.commit()

    return answer