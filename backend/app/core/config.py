from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    APP_NAME: str = "AI Sales Bot"
    APP_ENV: str = "development"

    DATABASE_URL: str

    # Production VPS SSH Tunnel configuration
    USE_SSH_TUNNEL: bool = True
    VPS_HOST: str = "147.93.31.98"
    VPS_PORT: int = 22
    VPS_USER: str = "root"
    VPS_PASSWORD: str = ""

    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TEMPERATURE: float = 0.2
    OPENAI_MAX_RETRIES: int = 2
    OPENAI_TIMEOUT_SECONDS: float = 30.0

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    SUPERADMIN_EMAIL: str = "superadmin@platform.com"
    SUPERADMIN_PASSWORD: str = "adminpass123"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@aisalesbot.com"
    EMAILS_FROM_NAME: str = "AI Sales Bot Platform"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()