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
app.mount("/static", StaticFiles(directory="app/static"), name="static")

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