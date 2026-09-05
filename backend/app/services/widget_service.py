from urllib.parse import urlparse
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.widget_config import WidgetConfig, generate_site_key
from app.schemas.widget import WidgetConfigUpdate


async def get_or_create_widget_config(db: AsyncSession, company_id: int) -> WidgetConfig:
    """Asynchronously gets an existing WidgetConfig for a company or creates a default one."""
    result = await db.execute(
        select(WidgetConfig).where(WidgetConfig.company_id == company_id)
    )
    config = result.scalar_one_or_none()

    if config is None:
        config = WidgetConfig(company_id=company_id)
        db.add(config)
        await db.commit()
        await db.refresh(config)

    return config


async def update_widget_config(
    db: AsyncSession, company_id: int, data: WidgetConfigUpdate
) -> WidgetConfig:
    """Asynchronously updates widget configuration for a company."""
    config = await get_or_create_widget_config(db, company_id)

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(config, field, value)

    await db.commit()
    await db.refresh(config)
    return config


async def regenerate_site_key(db: AsyncSession, company_id: int) -> WidgetConfig:
    """Asynchronously regenerates a fresh site_key for a company."""
    config = await get_or_create_widget_config(db, company_id)
    config.site_key = generate_site_key()
    await db.commit()
    await db.refresh(config)
    return config


def _is_origin_allowed(allowed_domains_str: str | None, origin: str | None) -> bool:
    """
    Validates if an incoming origin is allowed by the widget domain whitelist.
    allowed_domains_str can be '*' (all) or comma-separated list of domains e.g. "example.com, mysite.org".
    """
    if not allowed_domains_str or allowed_domains_str.strip() == "*":
        return True

    if not origin:
        return True

    parsed = urlparse(origin)
    origin_host = (parsed.hostname or origin).lower().strip()

    allowed_list = [d.strip().lower() for d in allowed_domains_str.split(",") if d.strip()]

    for allowed in allowed_list:
        if allowed == "*" or origin_host == allowed or origin_host.endswith(f".{allowed}"):
            return True

    return False


async def get_public_widget_config(
    db: AsyncSession, site_key: str, origin: str | None = None
) -> tuple[WidgetConfig, Company]:
    """
    Asynchronously resolves public site_key to WidgetConfig and Company.
    Validates widget activation state and domain origin restrictions.
    """
    res = await db.execute(
        select(WidgetConfig, Company)
        .join(Company, WidgetConfig.company_id == Company.id)
        .where(WidgetConfig.site_key == site_key)
    )
    result = res.first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Invalid or unknown widget site key",
        )

    config, company = result

    if not config.is_enabled or not company.is_active:
        raise HTTPException(
            status_code=403,
            detail="This chat widget is currently disabled",
        )

    if not _is_origin_allowed(config.allowed_domains, origin):
        raise HTTPException(
            status_code=403,
            detail="Domain origin is not authorized to use this chat widget",
        )

    return config, company
