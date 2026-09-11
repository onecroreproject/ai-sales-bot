import logging
import re
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

logger = logging.getLogger("app.database")

raw_url = settings.DATABASE_URL
ssh_tunnel = None

# If USE_SSH_TUNNEL is enabled and VPS credentials are provided, establish SSH tunnel automatically
if settings.USE_SSH_TUNNEL and settings.VPS_HOST and settings.VPS_PASSWORD:
    import paramiko
    if not hasattr(paramiko, 'DSSKey'):
        paramiko.DSSKey = paramiko.pkey.PKey

    from sshtunnel import SSHTunnelForwarder
    
    remote_targets = ['172.19.0.2', '127.0.0.1', 'localhost']
    tunnel_started = False
    for target in remote_targets:
        try:
            logger.info(f"Opening SSH tunnel to {settings.VPS_HOST}:{settings.VPS_PORT} targeting {target}:5432...")
            ssh_tunnel = SSHTunnelForwarder(
                (settings.VPS_HOST, settings.VPS_PORT),
                ssh_username=settings.VPS_USER,
                ssh_password=settings.VPS_PASSWORD,
                remote_bind_address=(target, 5432),
            )
            ssh_tunnel.start()
            local_port = ssh_tunnel.local_bind_port
            logger.info(f"SSH Tunnel connected! Forwarding localhost:{local_port} -> VPS {target}:5432")
            raw_url = re.sub(r'@[^/]+/', f'@127.0.0.1:{local_port}/', raw_url)
            tunnel_started = True
            break
        except Exception as e:
            logger.warning(f"Failed SSH tunnel attempt to {target}: {e}")

    if not tunnel_started:
        logger.error("Could not establish SSH tunnel to any VPS target address.")

# Construct async DB connection URL for asyncpg
if raw_url.startswith("postgresql://"):
    async_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql+psycopg2://"):
    async_url = raw_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
else:
    async_url = raw_url

# Construct sync DB connection URL for psycopg2
if raw_url.startswith("postgresql+asyncpg://"):
    sync_url = raw_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
else:
    sync_url = raw_url

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
    sync_url,
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