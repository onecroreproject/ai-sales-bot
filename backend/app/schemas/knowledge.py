from pydantic import BaseModel, Field


class KnowledgeCreate(BaseModel):
    company_id: int
    product_id: int | None = None
    content: str = Field(..., min_length=5)


class KnowledgeUpdate(BaseModel):
    product_id: int | None = None
    content: str | None = Field(default=None, min_length=5)


class KnowledgeResponse(BaseModel):
    id: int
    company_id: int
    product_id: int | None
    content: str

    model_config = {
        "from_attributes": True
    }