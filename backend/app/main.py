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
        },
    )


# Static assets
app.mount("/api/static", StaticFiles(directory="app/static"), name="static")


@app.on_event("startup")
async def startup_db_init():
    try:
        from app.database.connection import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS origin_domain VARCHAR(255);"))
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);"))
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS location VARCHAR(255);"))
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);"))
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'ai';"))
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50) DEFAULT 'openai';"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100) DEFAULT 'gpt-4o-mini';"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS llm_api_key VARCHAR(500);"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS bot_persona VARCHAR(50) DEFAULT 'professional';"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_instructions TEXT;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_blocked_topics TEXT;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_competitors TEXT;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_pii_masking BOOLEAN DEFAULT TRUE;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_custom_refusal TEXT;"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS guardrail_tone_strictness VARCHAR(50) DEFAULT 'standard';"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token_expires_at TIMESTAMP;"))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS unanswered_queries (
                    id SERIAL PRIMARY KEY,
                    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
                    session_id VARCHAR(100),
                    question TEXT NOT NULL,
                    ai_response TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.commit()
            logger.info("Successfully ensured database schemas are up to date.")
    except Exception as e:
        logger.warning(f"DB startup migration note: {e}")

# Include Routers
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


@app.get("/")
def root():
    return {
        "message": "AI Sales Bot Backend Running"
    }


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