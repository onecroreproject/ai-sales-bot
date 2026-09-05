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

    return {
        "company_id": company_id,
        "total_leads": total_leads,
        "new_leads_today": new_leads_today,
        "total_products": total_products,
        "total_knowledge_chunks": total_knowledge_chunks,
        "total_requests": usage_summary["total_requests"],
        "total_tokens": usage_summary["total_tokens"],
        "total_cost_usd": usage_summary["total_cost_usd"],
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
