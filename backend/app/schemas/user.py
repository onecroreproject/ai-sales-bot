from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    company_id: int
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=72,
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    company_id: int
    email: EmailStr
    is_active: bool
    email_verified: bool = False
    verification_token: str | None = None

    model_config = {
        "from_attributes": True
    }