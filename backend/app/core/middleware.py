import logging
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger("app.middleware")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique X-Request-ID to every HTTP request,
    catches uncaught exceptions to return a safe 500 JSON response with request ID reference,
    and injects X-Request-ID into response headers.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = request_id

        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(f"Unhandled Server Error [Request ID: {request_id}]: {exc}", exc_info=True)
            response = JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "detail": f"An unexpected error occurred on the server. Reference ID: {request_id}",
                },
            )

        response.headers["X-Request-ID"] = request_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that injects standard OWASP web security headers into all responses.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
