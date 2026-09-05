from fastapi import APIRouter
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Dummy test router for triggering async unhandled exception
dummy_router = APIRouter()

@dummy_router.get("/test-error-endpoint")
async def trigger_error():
    raise RuntimeError("Test simulated crash")

app.include_router(dummy_router)


def test_cors_headers_preflight():
    response = client.options(
        "/api/v1/widget/public/chat",
        headers={
            "Origin": "https://external-website.com",
            "Access-Control-Request-Method": "POST",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://external-website.com"


def test_request_id_tracing_header():
    # Test auto-generation
    response = client.get("/")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"].startswith("req_")

    # Test client provided header propagation
    custom_id = "custom_req_123456"
    custom_resp = client.get("/", headers={"X-Request-ID": custom_id})
    assert custom_resp.headers["X-Request-ID"] == custom_id


def test_security_headers_present():
    response = client.get("/")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_global_unhandled_exception_handler():
    response = client.get("/test-error-endpoint")
    assert response.status_code == 500
    body = response.json()
    assert body["error"] == "Internal Server Error"
    assert "An unexpected error occurred on the server" in body["detail"]
    assert "X-Request-ID" in response.headers
