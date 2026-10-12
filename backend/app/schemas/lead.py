from datetime import datetime
from pydantic import BaseModel, EmailStr


class LeadCreate(BaseModel):
    company_id: int
    session_id: str | None = None

    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company_name: str | None = None
    requirement: str | None = None
    status: str | None = "new"


class LeadResponse(BaseModel):
    id: int
    company_id: int
    session_id: int | None = None

    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company_name: str | None = None
    requirement: str | None = None
    status: str
    created_at: datetime | None = None
    location: str | None = None
    origin_domain: str | None = None

    model_config = {
        "from_attributes": True
    }


class LeadUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company_name: str | None = None
    requirement: str | None = None
    status: str | None = None