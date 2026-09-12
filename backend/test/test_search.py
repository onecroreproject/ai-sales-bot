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

client = TestClient(app)

DUMMY_VECTOR = [0.1] * 1536


@pytest.mark.anyio
async def test_rag_search_knowledge_endpoint():
    async with AsyncSessionLocal() as db:
        email = f"search_admin_{uuid.uuid4().hex[:6]}@test.com"
        comp = await create_company(db, CompanyCreate(name=f"Search Corp {uuid.uuid4().hex[:4]}", website="https://searchcorp.com"))
        user = await register_user(db, company_id=comp.id, email=email, password="password123")
        user.email_verified = True
        await db.commit()
        login = await login_user(db, email=email, password="password123")
        token = login["access_token"]

        product = await create_product(
            db,
            ProductCreate(company_id=comp.id, name="Search Engine Pro", price=299.0)
        )

        with patch("app.services.knowledge_service.create_embedding", new=AsyncMock(return_value=DUMMY_VECTOR)):
            await create_knowledge(
                db,
                KnowledgeCreate(
                    company_id=comp.id,
                    product_id=product.id,
                    content="Search Engine Pro indexes documents in sub-milliseconds with pgvector."
                )
            )

        with patch("app.services.search_service.create_embedding", new=AsyncMock(return_value=DUMMY_VECTOR)):
            search_payload = {
                "company_id": comp.id,
                "query": "How fast does Search Engine Pro index data?",
                "limit": 3
            }
            res = client.post(
                "/api/v1/search",
                json=search_payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert res.status_code == 200
            results = res.json()
            assert len(results) >= 1
            assert "Search Engine Pro" in results[0]["content"]
