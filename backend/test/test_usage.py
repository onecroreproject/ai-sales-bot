import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import AsyncSessionLocal
from app.services.usage_service import calculate_cost_usd, record_token_usage, get_company_usage_summary
from app.models.company import Company

client = TestClient(app)


def test_calculate_cost_usd():
    cost = calculate_cost_usd("gpt-4o-mini", 1_000_000, 1_000_000)
    assert cost == 0.75

    small_cost = calculate_cost_usd("gpt-4o-mini", 1000, 500)
    assert small_cost == round((1000/1000000)*0.15 + (500/1000000)*0.60, 8)


@pytest.mark.anyio
async def test_record_and_aggregate_token_usage():
    async with AsyncSessionLocal() as db:
        company = Company(name="Test Usage Corp", website="https://usagecorp.com")
        db.add(company)
        await db.commit()
        await db.refresh(company)

        await record_token_usage(
            db=db,
            company_id=company.id,
            session_id="sess_123",
            model="gpt-4o-mini",
            prompt_tokens=500,
            completion_tokens=200,
        )
        await record_token_usage(
            db=db,
            company_id=company.id,
            session_id="sess_123",
            model="gpt-4o-mini",
            prompt_tokens=1000,
            completion_tokens=300,
        )
        await db.commit()

        summary = await get_company_usage_summary(db, company_id=company.id)
        assert summary["company_id"] == company.id
        assert summary["total_prompt_tokens"] == 1500
        assert summary["total_completion_tokens"] == 500
        assert summary["total_tokens"] == 2000
        assert summary["total_requests"] == 2
        assert summary["total_cost_usd"] > 0.0


def test_usage_summary_unauthorized():
    response = client.get("/api/v1/usage/summary")
    assert response.status_code == 401
