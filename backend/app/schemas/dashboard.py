from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    company_id: int
    total_leads: int
    new_leads_today: int
    total_products: int
    total_knowledge_chunks: int
    total_requests: int
    total_tokens: int
    total_cost_usd: float
