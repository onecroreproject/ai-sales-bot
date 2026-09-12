import uuid
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import AsyncSessionLocal
from app.services.company_service import create_company
from app.services.product_service import create_product
from app.services.knowledge_service import create_knowledge
from app.services.auth_service import register_user, login_user
from app.schemas.company import CompanyCreate
from app.schemas.product import ProductCreate
from app.schemas.knowledge import KnowledgeCreate
from app.models.chat_session import ChatSession

client = TestClient(app)
DUMMY_VECTOR = [0.1] * 1536


@pytest.mark.anyio
async def test_full_admin_crud_and_dashboard_stats():
    async with AsyncSessionLocal() as db:
        # Setup company and user
        email = f"admin_crud_{uuid.uuid4().hex[:6]}@test.com"
        comp = await create_company(db, CompanyCreate(name=f"Admin Corp {uuid.uuid4().hex[:4]}", website="https://admincorp.com"))
        user = await register_user(db, company_id=comp.id, email=email, password="password123")
        user.email_verified = True
        await db.commit()
        login = await login_user(db, email=email, password="password123")
        token = login["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Test GET /auth/me & GET /companies/me
        me_res = client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email

        comp_me_res = client.get("/api/v1/companies/me", headers=headers)
        assert comp_me_res.status_code == 200
        assert comp_me_res.json()["id"] == comp.id

        # 2. Test PUT /companies/{id}
        put_comp = client.put(f"/api/v1/companies/{comp.id}", json={"description": "Updated Admin Corp description"}, headers=headers)
        assert put_comp.status_code == 200
        assert put_comp.json()["description"] == "Updated Admin Corp description"

        # 3. Test Product PUT & DELETE
        product = await create_product(db, ProductCreate(company_id=comp.id, name="Initial Product", price=49.99))
        put_prod = client.put(f"/api/v1/products/{product.id}", json={"name": "Updated Product", "price": 59.99}, headers=headers)
        assert put_prod.status_code == 200
        assert put_prod.json()["name"] == "Updated Product"

        # 4. Test Knowledge PUT & DELETE
        with patch("app.services.knowledge_service.create_embedding", new=AsyncMock(return_value=DUMMY_VECTOR)):
            knowledge = await create_knowledge(db, KnowledgeCreate(company_id=comp.id, product_id=product.id, content="Initial knowledge text"))
            put_know = client.put(f"/api/v1/knowledge/{knowledge.id}", json={"content": "Updated knowledge text content"}, headers=headers)
            assert put_know.status_code == 200
            assert put_know.json()["content"] == "Updated knowledge text content"

        # 5. Test Lead GET & DELETE
        sess_str = f"sess_{uuid.uuid4().hex[:6]}"
        chat_sess = ChatSession(company_id=comp.id, session_id=sess_str)
        db.add(chat_sess)
        await db.commit()

        lead_res = client.post("/api/v1/leads", json={"company_id": comp.id, "session_id": sess_str, "name": "John Doe", "email": "john@test.com"}, headers=headers)
        assert lead_res.status_code == 200
        lead_id = lead_res.json()["id"]

        get_lead_res = client.get(f"/api/v1/leads/{lead_id}", headers=headers)
        assert get_lead_res.status_code == 200
        assert get_lead_res.json()["name"] == "John Doe"

        # 6. Test GET /dashboard/stats
        stats_res = client.get("/api/v1/dashboard/stats", headers=headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["company_id"] == comp.id
        assert stats["total_leads"] >= 1
        assert stats["total_products"] >= 1
        assert stats["total_knowledge_chunks"] >= 1

        # 7. Cleanup DELETE calls
        del_know = client.delete(f"/api/v1/knowledge/{knowledge.id}", headers=headers)
        assert del_know.status_code == 24 or del_know.status_code == 204

        del_prod = client.delete(f"/api/v1/products/{product.id}", headers=headers)
        assert del_prod.status_code == 204

        del_lead = client.delete(f"/api/v1/leads/{lead_id}", headers=headers)
        assert del_lead.status_code == 204
