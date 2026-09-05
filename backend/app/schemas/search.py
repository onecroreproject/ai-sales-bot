from pydantic import BaseModel


class SearchRequest(BaseModel):
    company_id: int
    query: str
    limit: int = 5


class SearchResult(BaseModel):
    id: int
    company_id: int
    product_id: int | None
    content: str

    class Config:
        from_attributes = True