from datetime import datetime
from pydantic import BaseModel, Field


class WidgetConfigUpdate(BaseModel):
    bot_title: str | None = Field(default=None, min_length=1, max_length=100)
    greeting_message: str | None = Field(default=None, min_length=1)
    primary_color: str | None = Field(default=None, pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    widget_icon: str | None = Field(default=None, max_length=50)
    custom_icon_url: str | None = Field(default=None, description="Custom company logo image URL")
    allowed_domains: str | None = Field(default=None, description="Comma-separated domains or *")
    is_enabled: bool | None = None


class WidgetConfigResponse(BaseModel):
    id: int
    company_id: int
    site_key: str
    bot_title: str
    greeting_message: str
    primary_color: str
    widget_icon: str = "Bot"
    custom_icon_url: str | None = None
    allowed_domains: str | None
    is_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PublicWidgetConfigResponse(BaseModel):
    site_key: str
    company_name: str
    bot_title: str
    greeting_message: str
    primary_color: str
    widget_icon: str = "Bot"
    custom_icon_url: str | None = None
    is_enabled: bool


class PublicChatRequest(BaseModel):
    site_key: str = Field(..., description="Public site key of the company")
    session_id: str = Field(..., description="Unique visitor session identifier")
    message: str = Field(..., min_length=1, description="Visitor query or message")


class PublicChatResponse(BaseModel):
    session_id: str
    answer: str
