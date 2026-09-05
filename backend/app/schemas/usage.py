from pydantic import BaseModel


class UsageSummaryResponse(BaseModel):
    company_id: int
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    total_requests: int
    total_cost_usd: float
