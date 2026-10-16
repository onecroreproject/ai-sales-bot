from datetime import datetime
from pydantic import BaseModel, Field


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    website: str | None = None
    description: str | None = None
    is_verified: bool = False


class TestLLMRequest(BaseModel):
    provider: str = Field(default="openai")
    model: str | None = None
    api_key: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    website: str | None = None
    description: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None
    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None
    bot_persona: str | None = None
    custom_instructions: str | None = None
    guardrail_blocked_topics: str | None = None
    guardrail_competitors: str | None = None
    guardrail_pii_masking: bool | None = None
    guardrail_custom_refusal: str | None = None
    guardrail_tone_strictness: str | None = None
    webhook_url: str | None = None
    telegram_bot_token: str | None = None
    whatsapp_number: str | None = None
    auto_crawl_enabled: bool | None = None
    crawl_frequency_days: int | None = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    website: str | None = None
    description: str | None = None
    is_active: bool = True
    is_verified: bool = False
    llm_provider: str | None = "openai"
    llm_model: str | None = "gpt-4o-mini"
    llm_api_key: str | None = None
    bot_persona: str | None = "professional"
    custom_instructions: str | None = None
    guardrail_blocked_topics: str | None = None
    guardrail_competitors: str | None = None
    guardrail_pii_masking: bool | None = True
    guardrail_custom_refusal: str | None = None
    guardrail_tone_strictness: str | None = "standard"
    webhook_url: str | None = None
    telegram_bot_token: str | None = None
    whatsapp_number: str | None = None
    auto_crawl_enabled: bool | None = False
    crawl_frequency_days: int | None = 7
    last_crawled_at: datetime | str | None = None

    model_config = {
        "from_attributes": True
    }