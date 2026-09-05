from decimal import Decimal
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    company_id: int
    name: str = Field(..., min_length=2, max_length=200)
    description: str | None = None
    price: Decimal | None = None
    features: str | None = None
    benefits: str | None = None
    target_customer: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    price: Decimal | None = None
    features: str | None = None
    benefits: str | None = None
    target_customer: str | None = None


class ProductResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: str | None = None
    price: Decimal | None = None
    features: str | None = None
    benefits: str | None = None
    target_customer: str | None = None

    model_config = {
        "from_attributes": True
    }