from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.database.base import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("chat_sessions.id"),
        nullable=True,
    )

    name: Mapped[str | None] = mapped_column(String(200))

    email: Mapped[str | None] = mapped_column(String(255))

    phone: Mapped[str | None] = mapped_column(String(50))

    company_name: Mapped[str | None] = mapped_column(String(200))

    requirement: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(
        String(30),
        default="new",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )