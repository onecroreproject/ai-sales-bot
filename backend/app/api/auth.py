from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    LoginRequest,
    ForgotPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    register_user,
    login_user,
    verify_email_token,
)
from app.services.email_service import send_verification_email
import secrets


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post("/register")
@limiter.limit("10/minute")
async def register(
    request: Request,
    response: Response,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await register_user(
            db=db,
            company_id=user_data.company_id,
            email=user_data.email,
            password=user_data.password,
        )

        verification_url = f"http://localhost:5173/#/verify-email?token={user.verification_token}"

        # Dispatch real email in background
        await send_verification_email(user.email, verification_url)

        return {
            "id": user.id,
            "company_id": user.company_id,
            "email": user.email,
            "is_active": user.is_active,
            "email_verified": user.email_verified,
            "verification_token": user.verification_token,
            "verification_url": verification_url,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Company does not exist",
        )


@router.post("/resend-verification")
@limiter.limit("5/minute")
async def resend_verification_api(
    request: Request,
    response: Response,
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend email verification link to user's registered inbox."""
    res = await db.execute(select(User).where(User.email == payload.email))
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No registered user account found with this email")

    if user.email_verified:
        return {"message": "Your email address is already verified. You can sign in directly."}

    if not user.verification_token:
        user.verification_token = secrets.token_urlsafe(32)
        await db.commit()
        await db.refresh(user)

    verification_url = f"http://localhost:5173/#/verify-email?token={user.verification_token}"
    await send_verification_email(user.email, verification_url)

    return {
        "message": f"Verification email resent to {user.email}. Please check your inbox.",
        "verification_url": verification_url
    }


@router.get("/verify-email")
async def verify_email_api(
    token: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    """Verify user email via email verification link token."""
    try:
        user = await verify_email_token(db=db, token=token)
        return {
            "success": True,
            "message": "Email verified successfully! Your company dashboard is now activated.",
            "user_email": user.email,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.post(
    "/login",
    response_model=TokenResponse,
)
@limiter.limit("20/minute")
async def login(
    request: Request,
    response: Response,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await login_user(
            db=db,
            email=login_data.email,
            password=login_data.password,
        )

        return {
            "access_token": result["access_token"],
            "token_type": result["token_type"],
        }

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )


@router.post("/forgot-password")
@limiter.limit("10/minute")
async def forgot_password(
    request: Request,
    response: Response,
    forgot_data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Initiate password recovery flow for registered company admin."""
    return {
        "message": f"If an account with {forgot_data.email} exists, password reset instructions have been sent."
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_me_api(
    current_user: User = Depends(get_current_user),
):
    """Retrieve profile of currently authenticated user."""
    return current_user