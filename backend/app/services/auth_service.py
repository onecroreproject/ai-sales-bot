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
        email_verified=False,
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