from pydantic import BaseModel, EmailStr


class LeadCreate(BaseModel):
    company_id: int
    session_id: str

    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company_name: str | None = None
    requirement: str | None = None


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