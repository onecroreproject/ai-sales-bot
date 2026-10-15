from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from app.core.config import settings
try:
    from pwdlib import PasswordHash
    from pwdlib.hashers.bcrypt import BcryptHasher
    pwd_context = PasswordHash((BcryptHasher(),))

    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
except ImportError:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)



# In-memory revoked token set (can be backed by Redis in distributed environments)
_REVOKED_TOKENS: set[str] = set()


def revoke_token(token: str) -> None:
    """Revoke an active token so it cannot be used again."""
    _REVOKED_TOKENS.add(token.strip())


def is_token_revoked(token: str) -> bool:
    """Check if a token has been explicitly revoked."""
    return token.strip() in _REVOKED_TOKENS


def create_access_token(
    user_id: int,
    company_id: int,
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a signed JWT token with standard claims."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "company_id": company_id,
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """Decode and validate a signed JWT token."""
    if is_token_revoked(token):
        raise ValueError("Token has been revoked")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("user_id")
        company_id = payload.get("company_id")

        if user_id is None or company_id is None:
            raise ValueError("Invalid token")

        return {
            "user_id": int(user_id),
            "company_id": int(company_id),
        }

    except (JWTError, ValueError, TypeError):
        raise ValueError("Invalid or expired token")