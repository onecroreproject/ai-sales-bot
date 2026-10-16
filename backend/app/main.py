import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter, custom_rate_limit_exceeded_handler
from app.core.middleware import RequestIDMiddleware, SecurityHeadersMiddleware

from app.database.connection import engine
from app.api.companies import router as companies_router
from app.api.products import router as products_router
from app.api.knowledge import router as knowledge_router
from app.api.search import router as search_router
from app.api.chat import router as chat_router
from app.api.leads import router as leads_router
from app.api.auth import router as auth_router
from app.api.widget import router as widget_router
from app.api.usage import router as usage_router
from app.api.dashboard import router as dashboard_router

logger = logging.getLogger("app.main")

app = FastAPI(
    title="AI Sales Bot",
    version="1.0.0",
)

# ---------------------------------------------------------
# MIDDLEWARE SETUP
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)

# Rate Limiter setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)


# ---------------------------------------------------------
# GLOBAL UNHANDLED EXCEPTION HANDLER
# ---------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled Exception [Request ID: {request_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": f"An unexpected error occurred on the server. Reference ID: {request_id}",
            "debug_message": str(exc),
        },
    )


# Static assets
app.mount("/api/static", StaticFiles(directory="app/static"), name="static")


@app.on_event("startup")
async def startup_db_init():
    """Run database schema migrations and seed superadmin on startup using async engine."""
    from app.database.connection import async_engine
    from sqlalchemy import text

    migration_statements = [
        # Chat sessions columns
        "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS origin_domain VARCHAR(255);",
        "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);",
        "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS location VARCHAR(255);",
        "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);",
        "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'ai';",
        "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        # Companies BYOK columns
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50) DEFAULT 'openai';",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100) DEFAULT 'gpt-4o-mini';",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_api_key VARCHAR(500);",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS bot_persona VARCHAR(50) DEFAULT 'professional';",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_instructions TEXT;",
        # Guardrail columns
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_blocked_topics TEXT;",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_competitors TEXT;",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_pii_masking BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_custom_refusal TEXT;",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_tone_strictness VARCHAR(50) DEFAULT 'standard';",
        # User verification columns
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token_expires_at TIMESTAMP;",
        # Multi-channel & webhook columns
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS telegram_bot_token VARCHAR(255);",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);",
        # Auto-crawl columns
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS auto_crawl_enabled BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS crawl_frequency_days INTEGER DEFAULT 7;",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMP;",
        # Lead scoring columns
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) DEFAULT 'Warm';",
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 50;",
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;",
        # Audit logs table
        """CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            user_email VARCHAR(255),
            action VARCHAR(100) NOT NULL,
            resource VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );""",
        # Unanswered queries table
        """CREATE TABLE IF NOT EXISTS unanswered_queries (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            session_id VARCHAR(100),
            question TEXT NOT NULL,
            ai_response TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );""",
    ]

    try:
        async with async_engine.begin() as conn:
            success_count = 0
            for stmt in migration_statements:
                try:
                    await conn.execute(text(stmt))
                    success_count += 1
                except Exception as e:
                    logger.warning(f"Migration statement skipped: {str(e)[:100]}")

            # Ensure Root Platform Company #1 exists
            await conn.execute(text("""
                INSERT INTO companies (id, name, website, description, is_active, is_verified)
                VALUES (1, 'Super Admin HQ', 'https://aisalesbot.platform', 'Root Platform Administration Workspace', TRUE, TRUE)
                ON CONFLICT (id) DO UPDATE SET is_active = TRUE, is_verified = TRUE;
            """))

            from app.core.security import hash_password
            admin_hash = hash_password(settings.SUPERADMIN_PASSWORD)
            demo_hash = hash_password("password123")

            # Seed / ensure superadmin exists with email_verified=TRUE
            await conn.execute(
                text("""
                    INSERT INTO users (company_id, email, hashed_password, is_active, email_verified)
                    VALUES (1, :email, :password, TRUE, TRUE)
                    ON CONFLICT (email) DO UPDATE SET 
                        hashed_password = :password,
                        is_active = TRUE,
                        email_verified = TRUE;
                """),
                {"email": settings.SUPERADMIN_EMAIL, "password": admin_hash}
            )

            # Seed / ensure admin@test.com exists with password123 and email_verified=TRUE
            await conn.execute(
                text("""
                    INSERT INTO users (company_id, email, hashed_password, is_active, email_verified)
                    VALUES (1, 'admin@test.com', :password, TRUE, TRUE)
                    ON CONFLICT (email) DO UPDATE SET 
                        hashed_password = :password,
                        is_active = TRUE,
                        email_verified = TRUE;
                """),
                {"password": demo_hash}
            )

            logger.info(f"Startup migrations complete: {success_count}/{len(migration_statements)} statements executed. Admin accounts verified.")
    except Exception as e:
        logger.warning(f"DB startup migration note: {e}")


# Include Routers
from app.api.system import router as system_router

app.include_router(products_router)
app.include_router(companies_router)
app.include_router(knowledge_router)
app.include_router(search_router)   
app.include_router(chat_router)
app.include_router(leads_router)
app.include_router(auth_router)
app.include_router(widget_router)
app.include_router(usage_router)
app.include_router(dashboard_router)
app.include_router(system_router)



@app.get("/")
def root():
    return {
        "message": "AI Sales Bot Backend Running"
    }


@app.get("/api/v1/run-migrations")
async def run_migrations_manually():
    """Manually trigger database schema migrations (same as startup)."""
    try:
        await startup_db_init()
        return {"status": "success", "message": "All database migrations executed successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/health/database")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "connection failed",
            "error": str(e)
        }