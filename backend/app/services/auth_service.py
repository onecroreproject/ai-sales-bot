import secrets
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.company import Company
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


async def register_user(
    db: AsyncSession,
    company_id: int,
    email: str,
    password: str,
):
    result = await db.execute(
        select(User).where(User.email == email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user is not None:
        raise ValueError("User with this email already exists")

    verification_token = secrets.token_urlsafe(32)

    user = User(
        company_id=company_id,
        email=email,
        hashed_password=hash_password(password),
        is_active=True,
        email_verified=True,
        verification_token=verification_token,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


async def verify_email_token(db: AsyncSession, token: str) -> User:
    """Verifies a user email using their verification token and activates their company."""
    res = await db.execute(select(User).where(User.verification_token == token))
    user = res.scalar_one_or_none()

    if user is None:
        raise ValueError("Invalid or expired email verification token")

    user.email_verified = True
    user.verification_token = None

    # Automatically mark company as verified
    res_comp = await db.execute(select(Company).where(Company.id == user.company_id))
    comp = res_comp.scalar_one_or_none()
    if comp:
        comp.is_verified = True

    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
):
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if user is None:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    return user


async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
):
    user = await authenticate_user(
        db=db,
        email=email,
        password=password,
    )

    if user is None:
        raise ValueError("Invalid email or password")

    # Super admin bypasses verification check
    if email != settings.SUPERADMIN_EMAIL:
        if not user.email_verified:
            raise ValueError("Email address not verified. Please check your email inbox and click the verification link before logging in.")

    access_token = create_access_token(
        user_id=user.id,
        company_id=user.company_id,
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


async def request_password_reset(db: AsyncSession, email: str) -> str | None:
    """Generates password reset token and saves expiry (1 hour). Returns token if user exists."""
    from datetime import datetime, timedelta
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        return None

    token = secrets.token_urlsafe(32)
    user.reset_password_token = token
    user.reset_password_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    await db.commit()
    await db.refresh(user)
    return token


async def reset_user_password(db: AsyncSession, token: str, new_password: str) -> User:
    """Verifies reset token, updates hashed password, and clears reset token."""
    from datetime import datetime
    result = await db.execute(select(User).where(User.reset_password_token == token))
    user = result.scalar_one_or_none()

    if user is None:
        raise ValueError("Invalid or expired password reset link")

    if user.reset_password_token_expires_at and user.reset_password_token_expires_at < datetime.utcnow():
        raise ValueError("Password reset link has expired. Please request a new one.")

    user.hashed_password = hash_password(new_password)
    user.reset_password_token = None
    user.reset_password_token_expires_at = None
    # Automatically verify email if they proved ownership through reset link
    user.email_verified = True

    await db.commit()
    await db.refresh(user)
    return user