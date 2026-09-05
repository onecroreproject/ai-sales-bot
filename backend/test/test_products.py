import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import AsyncSessionLocal
from app.services.company_service import create_company
from app.services.auth_service import register_user, login_user
from app.schemas.company import CompanyCreate

client = TestClient(app)


@pytest.mark.anyio
async def test_products_authorization_and_isolation():
    async with AsyncSessionLocal() as db:
        email = f"usera_prod_{uuid.uuid4().hex[:6]}@test.com"
        comp_a = await create_company(db, CompanyCreate(name=f"Company A {uuid.uuid4().hex[:4]}", website="https://a.com"))
        user_a = await register_user(db, company_id=comp_a.id, email=email, password="password123")
        login_a = await login_user(db, email=email, password="password123")
        token_a = login_a["access_token"]

        comp_b = await create_company(db, CompanyCreate(name=f"Company B {uuid.uuid4().hex[:4]}", website="https://b.com"))

        prod_payload = {
            "company_id": comp_a.id,
            "name": "Cloud CRM Pro",
            "description": "Enterprise CRM",
            "price": 99.99,
            "features": "AI Sales pipeline, Leads management",
            "benefits": "Boost sales by 40%",
            "target_customer": "B2B SaaS"
        }
        res_a = client.post(
            "/api/v1/products",
            json=prod_payload,
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_a.status_code == 200
        assert res_a.json()["name"] == "Cloud CRM Pro"

        prod_payload_b = {**prod_payload, "company_id": comp_b.id}
        res_forbidden = client.post(
            "/api/v1/products",
            json=prod_payload_b,
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_forbidden.status_code == 403

        list_res = client.get(
            "/api/v1/products",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 1
