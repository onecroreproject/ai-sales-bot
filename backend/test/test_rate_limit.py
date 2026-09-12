from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_login_rate_limit():
    # Attempt 20 login calls (within limit)
    for _ in range(20):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@test.com", "password": "wrongpassword"}
        )
        # Should be 401 Unauthorized, not 429
        assert response.status_code == 401

    # 21st attempt exceeds the 20/minute rate limit
    exceeded_response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@test.com", "password": "wrongpassword"}
    )
    assert exceeded_response.status_code == 429
    body = exceeded_response.json()
    assert body["error"] == "Rate limit exceeded"
    assert "limit of 20 per 1 minute exceeded" in body["detail"]
