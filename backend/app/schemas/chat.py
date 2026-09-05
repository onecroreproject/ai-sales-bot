from pydantic import BaseModel


class ChatRequest(BaseModel):
    company_id: int
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    answer: str