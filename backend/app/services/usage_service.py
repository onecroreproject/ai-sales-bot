from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token_usage import TokenUsage


def calculate_cost_usd(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculates estimated USD cost for model token usage."""
    if "gpt-4o-mini" in model:
        prompt_cost = (prompt_tokens / 1_000_000.0) * 0.150
        completion_cost = (completion_tokens / 1_000_000.0) * 0.600
        return round(prompt_cost + completion_cost, 8)
    elif "embedding" in model:
        return round((prompt_tokens / 1_000_000.0) * 0.020, 8)
    else:
        prompt_cost = (prompt_tokens / 1_000_000.0) * 2.50
        completion_cost = (completion_tokens / 1_000_000.0) * 10.00
        return round(prompt_cost + completion_cost, 8)


async def record_token_usage(
    db: AsyncSession,
    company_id: int,
    session_id: str | None,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> TokenUsage:
    """Asynchronously records a single AI request token usage and cost entry in the database."""
    total_tokens = prompt_tokens + completion_tokens
    cost_usd = calculate_cost_usd(model, prompt_tokens, completion_tokens)

    usage = TokenUsage(
        company_id=company_id,
        session_id=session_id,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost_usd=cost_usd,
    )

    db.add(usage)
    await db.flush()
    return usage


async def get_company_usage_summary(db: AsyncSession, company_id: int) -> dict:
    """Asynchronously aggregates company usage metrics (tokens, requests, estimated cost)."""
    result = await db.execute(
        select(
            func.coalesce(func.sum(TokenUsage.prompt_tokens), 0).label("total_prompt_tokens"),
            func.coalesce(func.sum(TokenUsage.completion_tokens), 0).label("total_completion_tokens"),
            func.coalesce(func.sum(TokenUsage.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.count(TokenUsage.id), 0).label("total_requests"),
            func.coalesce(func.sum(TokenUsage.cost_usd), 0.0).label("total_cost_usd"),
        ).where(TokenUsage.company_id == company_id)
    )
    row = result.first()

    return {
        "company_id": company_id,
        "total_prompt_tokens": int(row.total_prompt_tokens),
        "total_completion_tokens": int(row.total_completion_tokens),
        "total_tokens": int(row.total_tokens),
        "total_requests": int(row.total_requests),
        "total_cost_usd": round(float(row.total_cost_usd), 6),
    }
