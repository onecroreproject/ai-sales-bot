from pydantic import BaseModel, Field


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    website: str | None = None
    description: str | None = None
    is_verified: bool = False


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    website: str | None = None
    description: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    website: str | None = None
    description: str | None = None
    is_active: bool
    is_verified: bool = False

    model_config = {
        "from_attributes": True
    }