from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.lead import Lead
from app.models.product import Product
from app.models.product_knowledge import ProductKnowledge
from app.services.usage_service import get_company_usage_summary


async def get_dashboard_stats(
    db: AsyncSession,
    company_id: int,
) -> dict:
    # 1. Total leads count
    res_leads = await db.execute(
        select(func.count(Lead.id)).where(Lead.company_id == company_id)
    )
    total_leads = res_leads.scalar_one_or_none() or 0

    # 2. Today's leads count (naive UTC datetime matching database column)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    res_today = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.company_id == company_id,
            Lead.created_at >= today_start,
        )
    )
    new_leads_today = res_today.scalar_one_or_none() or 0

    # 3. Total products count
    res_prod = await db.execute(
        select(func.count(Product.id)).where(Product.company_id == company_id)
    )
    total_products = res_prod.scalar_one_or_none() or 0

    # 4. Total knowledge chunks count
    res_know = await db.execute(
        select(func.count(ProductKnowledge.id)).where(ProductKnowledge.company_id == company_id)
    )
    total_knowledge_chunks = res_know.scalar_one_or_none() or 0

    # 5. Usage & token metrics
    usage_summary = await get_company_usage_summary(db, company_id)

    # 6. Live recent agent activities
    recent_activities = []
    
    # 6a. Recent visitor chat queries
    from app.models.chat_session import ChatSession
    from app.models.chat_message import ChatMessage
    
    res_recent_chats = await db.execute(
        select(ChatMessage, ChatSession)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .where(ChatSession.company_id == company_id, ChatMessage.role == "user")
        .order_by(ChatMessage.created_at.desc())
        .limit(4)
    )
    for msg, sess in res_recent_chats.all():
        site_label = sess.origin_domain or "Live Website"
        loc_label = f" • {sess.location}" if sess.location and sess.location != "Online Visitor" else ""
        content_preview = (msg.content[:45] + "...") if len(msg.content) > 45 else msg.content
        recent_activities.append({
            "id": f"chat-{msg.id}",
            "type": "chat",
            "title": f'Visitor Query on {site_label}',
            "subtitle": f'"{content_preview}"{loc_label}',
            "time": msg.created_at.strftime("%I:%M %p") if msg.created_at else "Recent",
            "timestamp": msg.created_at.isoformat() if msg.created_at else None,
        })

    # 6b. Recent captured leads
    res_recent_leads = await db.execute(
        select(Lead)
        .where(Lead.company_id == company_id)
        .order_by(Lead.created_at.desc())
        .limit(3)
    )
    for lead in res_recent_leads.scalars().all():
        recent_activities.append({
            "id": f"lead-{lead.id}",
            "type": "lead",
            "title": f"New Lead Captured: {lead.name or lead.email}",
            "subtitle": f"Interest: {lead.requirement[:40]}..." if lead.requirement else f"Email: {lead.email}",
            "time": lead.created_at.strftime("%b %d") if lead.created_at else "Recent",
            "timestamp": lead.created_at.isoformat() if lead.created_at else None,
        })

    # Sort combined activities by timestamp descending
    recent_activities.sort(key=lambda x: x.get("timestamp") or "", reverse=True)

    # Fallback to system status items if activity is still empty
    if not recent_activities:
        recent_activities = [
            {
                "id": "sys-active",
                "type": "system",
                "title": "Bot Agent Active",
                "subtitle": "Published live on website widget & listening for queries",
                "time": "Real-time active",
            },
            {
                "id": "sys-kb",
                "type": "knowledge",
                "title": "Knowledge Base Vector Embeddings",
                "subtitle": f"{total_knowledge_chunks} knowledge chunks synchronized",
                "time": "Catalog ready",
            }
        ]

    return {
        "company_id": company_id,
        "total_leads": total_leads,
        "new_leads_today": new_leads_today,
        "total_products": total_products,
        "total_knowledge_chunks": total_knowledge_chunks,
        "total_requests": usage_summary["total_requests"],
        "total_tokens": usage_summary["total_tokens"],
        "total_cost_usd": usage_summary["total_cost_usd"],
        "recent_activities": recent_activities[:6],
    }


async def get_super_admin_stats(db: AsyncSession) -> dict:
    """Retrieve platform-wide aggregated metrics across all tenant companies."""
    res_companies = await db.execute(select(Company))
    companies = res_companies.scalars().all()

    company_summaries = []
    total_platform_leads = 0
    total_platform_products = 0
    total_platform_cost_usd = 0.0

    for comp in companies:
        c_stats = await get_dashboard_stats(db, comp.id)
        total_platform_leads += c_stats["total_leads"]
        total_platform_products += c_stats["total_products"]
        total_platform_cost_usd += c_stats["total_cost_usd"]

        company_summaries.append({
            "id": comp.id,
            "name": comp.name,
            "website": comp.website,
            "description": comp.description,
            "is_active": comp.is_active,
            "is_verified": getattr(comp, "is_verified", False),
            "created_at": comp.created_at.isoformat() if comp.created_at else None,
            "total_leads": c_stats["total_leads"],
            "total_products": c_stats["total_products"],
            "total_knowledge_chunks": c_stats["total_knowledge_chunks"],
            "total_requests": c_stats["total_requests"],
            "total_tokens": c_stats["total_tokens"],
            "total_cost_usd": c_stats["total_cost_usd"],
        })

    return {
        "total_companies": len(companies),
        "total_platform_leads": total_platform_leads,
        "total_platform_products": total_platform_products,
        "total_platform_cost_usd": round(total_platform_cost_usd, 4),
        "companies": company_summaries,
    }
