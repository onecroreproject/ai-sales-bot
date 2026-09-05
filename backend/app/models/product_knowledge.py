from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from datetime import datetime

from app.database.base import Base


class ProductKnowledge(Base):
    __tablename__ = "product_knowledge"

    id: Mapped[int] = mapped_column(primary_key=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id"),
        nullable=True,
        index=True,
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)

    embedding = mapped_column(Vector(1536))

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )