from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.database.base import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # BYOK / Multi-Model AI Settings
    llm_provider: Mapped[str] = mapped_column(String(50), default="openai", server_default="openai")
    llm_model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini", server_default="gpt-4o-mini")
    llm_api_key: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Bot Personality & Custom Rules (Phase 2)
    bot_persona: Mapped[str] = mapped_column(String(50), default="professional", server_default="professional")
    custom_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Dynamic AI Safety & Guardrails (Phase 3/4)
    guardrail_blocked_topics: Mapped[str | None] = mapped_column(Text, nullable=True)
    guardrail_competitors: Mapped[str | None] = mapped_column(Text, nullable=True)
    guardrail_pii_masking: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    guardrail_custom_refusal: Mapped[str | None] = mapped_column(Text, nullable=True)
    guardrail_tone_strictness: Mapped[str] = mapped_column(String(50), default="standard", server_default="standard")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )