from fastapi.testclient import TestClient
from app.main import app
from app.services.widget_service import _is_origin_allowed
from app.models.widget_config import generate_site_key

client = TestClient(app)


def test_site_key_generation():
    key1 = generate_site_key()
    key2 = generate_site_key()
    assert key1.startswith("sk_live_")
    assert key2.startswith("sk_live_")
    assert key1 != key2


def test_origin_domain_authorization():
    # Allow all
    assert _is_origin_allowed("*", "https://anything.com") is True
    assert _is_origin_allowed(None, "https://anything.com") is True

    # Domain list
    allowed = "example.com, mysite.org"
    assert _is_origin_allowed(allowed, "https://example.com") is True
    assert _is_origin_allowed(allowed, "http://sub.mysite.org:8080") is True
    assert _is_origin_allowed(allowed, "https://unauthorized.com") is False


def test_public_widget_config_invalid_key():
    response = client.get("/api/v1/widget/public/config/invalid_site_key_123")
    assert response.status_code == 404
    assert response.json()["detail"] == "Invalid or unknown widget site key"


def test_admin_widget_config_unauthorized():
    response = client.get("/api/v1/widget/config")
    assert response.status_code == 401


def test_static_widget_files():
    js_response = client.get("/static/widget.js")
    assert js_response.status_code == 200
    assert "AISalesBotSiteKey" in js_response.text

    html_response = client.get("/static/demo.html")
    assert html_response.status_code == 200
    assert "Acme SaaS Solutions" in html_response.text
