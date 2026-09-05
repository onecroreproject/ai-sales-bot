from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Construct async DB connection URL for asyncpg
raw_url = settings.DATABASE_URL
if raw_url.startswith("postgresql://"):
    async_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql+psycopg2://"):
    async_url = raw_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
else:
    async_url = raw_url

from sqlalchemy.pool import NullPool

# Async engine & sessionmaker for FastAPI application endpoints
async_engine = create_async_engine(
    async_url,
    pool_pre_ping=True,
    poolclass=NullPool,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Synchronous engine retained for Alembic & sync scripts
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yields an AsyncSession for FastAPI request dependencies."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()