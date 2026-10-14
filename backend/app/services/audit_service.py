from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
import logging

logger = logging.getLogger(__name__)


async def record_audit_event(
    db: AsyncSession,
    action: str,
    resource: str,
    company_id: int | None = None,
    user_email: str | None = None,
    details: str | None = None,
    ip_address: str | None = None,
) -> None:
    """Helper to record audit logs across the application."""
    try:
        log_entry = AuditLog(
            company_id=company_id,
            user_email=user_email,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address,
        )
        db.add(log_entry)
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to record audit log: {e}")
