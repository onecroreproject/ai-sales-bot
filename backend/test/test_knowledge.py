import uuid
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import AsyncSessionLocal
from app.services.company_service import create_company
from app.services.product_service import create_product
from app.services.auth_service import register_user, login_user
from app.schemas.company import CompanyCreate
from app.schemas.product import ProductCreate

client = TestClient(app)

DUMMY_VECTOR = [0.1] * 1536


@pytest.mark.anyio
async def test_knowledge_base_crud_and_filtering():
    async with AsyncSessionLocal() as db:
        email = f"kuser_{uuid.uuid4().hex[:6]}@test.com"
        comp = await create_company(db, CompanyCreate(name=f"Knowledge Corp {uuid.uuid4().hex[:4]}", website="https://kcorp.com"))
        user = await register_user(db, company_id=comp.id, email=email, password="password123")
        user.email_verified = True
        await db.commit()
        login = await login_user(db, email=email, password="password123")
        token = login["access_token"]

        product = await create_product(
            db,
            ProductCreate(
                company_id=comp.id,
                name="AI Analytics Suite",
                description="Realtime analytics",
                price=199.0
            )
        )

        with patch("app.services.knowledge_service.create_embedding", new=AsyncMock(return_value=DUMMY_VECTOR)):
            k_payload = {
                "company_id": comp.id,
                "product_id": product.id,
                "content": "AI Analytics Suite provides real-time dashboard analytics and automated SQL generation."
            }
            res = client.post(
                "/api/v1/knowledge",
                json=k_payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert res.status_code == 200
            k_data = res.json()
            assert k_data["content"] == k_payload["content"]
            assert k_data["product_id"] == product.id

            list_res = client.get(
                f"/api/v1/knowledge?product_id={product.id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert list_res.status_code == 200
            assert len(list_res.json()) >= 1
