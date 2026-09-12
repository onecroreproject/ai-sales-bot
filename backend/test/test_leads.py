import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import AsyncSessionLocal
from app.services.company_service import create_company
from app.services.auth_service import register_user, login_user
from app.schemas.company import CompanyCreate
from app.models.chat_session import ChatSession

client = TestClient(app)


@pytest.mark.anyio
async def test_lead_management_crud_and_status_update():
    async with AsyncSessionLocal() as db:
        email = f"lead_admin_{uuid.uuid4().hex[:6]}@test.com"
        comp = await create_company(db, CompanyCreate(name=f"Leads Inc {uuid.uuid4().hex[:4]}", website="https://leadsinc.com"))
        user = await register_user(db, company_id=comp.id, email=email, password="password123")
        user.email_verified = True
        await db.commit()
        login = await login_user(db, email=email, password="password123")
        token = login["access_token"]

        # Create valid ChatSession
        session_id_str = f"sess_{uuid.uuid4().hex[:6]}"
        chat_sess = ChatSession(company_id=comp.id, session_id=session_id_str)
        db.add(chat_sess)
        await db.commit()
        await db.refresh(chat_sess)

        lead_payload = {
            "company_id": comp.id,
            "session_id": session_id_str,
            "name": "Jane Doe",
            "email": "jane@prospectcorp.com",
            "phone": "+15550199",
            "company_name": "Prospect Corp",
            "requirement": "Looking for automated sales chatbot integration"
        }
        res = client.post(
            "/api/v1/leads",
            json=lead_payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        lead_data = res.json()
        assert lead_data["name"] == "Jane Doe"
        assert lead_data["status"] == "new"

        list_res = client.get(
            f"/api/v1/leads?company_id={comp.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_res.status_code == 200
        assert any(l["id"] == lead_data["id"] for l in list_res.json())

        patch_res = client.patch(
            f"/api/v1/leads/{lead_data['id']}?company_id={comp.id}",
            json={"status": "contacted"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "contacted"
