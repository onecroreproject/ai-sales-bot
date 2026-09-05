import secrets
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


def generate_site_key() -> str:
    """Generates a secure, unique public site key for embedding widgets."""
    return f"sk_live_{secrets.token_hex(16)}"


class WidgetConfig(Base):
    __tablename__ = "widget_configs"

    id: Mapped[int] = mapped_column(primary_key=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    site_key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        default=generate_site_key,
    )

    bot_title: Mapped[str] = mapped_column(
        String(100),
        default="Sales Assistant",
        nullable=False,
    )

    greeting_message: Mapped[str] = mapped_column(
        Text,
        default="Hello! How can I help you learn more about our products today?",
        nullable=False,
    )

    primary_color: Mapped[str] = mapped_column(
        String(20),
        default="#4F46E5",
        nullable=False,
    )

    widget_icon: Mapped[str] = mapped_column(
        String(50),
        default="Bot",
        nullable=False,
    )

    custom_icon_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    allowed_domains: Mapped[str | None] = mapped_column(
        Text,
        default="*",
        nullable=True,
        comment="Comma-separated allowed domain origins e.g. example.com,app.example.com or * for all",
    )

    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
