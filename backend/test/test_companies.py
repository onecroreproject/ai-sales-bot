import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import AsyncSessionLocal
from app.services.company_service import create_company
from app.schemas.company import CompanyCreate

client = TestClient(app)


@pytest.mark.anyio
async def test_company_crud_service_and_api():
    async with AsyncSessionLocal() as db:
        # Create company directly via service
        c_data = CompanyCreate(
            name="Acme Corp Test",
            website="https://acmetest.com",
            description="Test company description"
        )
        company = await create_company(db, c_data)
        assert company.id is not None
        assert company.name == "Acme Corp Test"

        # List companies API
        response = client.get("/api/v1/companies")
        assert response.status_code == 200
        companies = response.json()
        assert any(c["id"] == company.id for c in companies)

        # Get single company API
        get_resp = client.get(f"/api/v1/companies/{company.id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["name"] == "Acme Corp Test"

        # Get non-existent company 404
        not_found_resp = client.get("/api/v1/companies/999999")
        assert not_found_resp.status_code == 404
