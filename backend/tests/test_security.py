import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import is_safe_url
from app.services.ai_service import AIService
from app.config import AppSettings
from unittest.mock import patch


# 1. SSRF URL Validation Tests
def test_is_safe_url_validation():
    # Unsafe local/private/loopback URLs should return False
    assert not is_safe_url("http://localhost")
    assert not is_safe_url("http://127.0.0.1")
    assert not is_safe_url("http://127.0.0.1:8000")
    assert not is_safe_url("http://169.254.169.254")
    assert not is_safe_url("http://192.168.1.10")
    assert not is_safe_url("http://10.0.0.1")
    assert not is_safe_url("http://172.16.0.2")
    assert not is_safe_url("http://[::1]")

    # Public URLs should return True
    assert is_safe_url("https://makerworld.com/en/models/12345")
    assert is_safe_url("https://printables.com/model/67890")
    assert is_safe_url("https://google.com")
    assert is_safe_url("https://github.com/astral-sh/uv")


@pytest.mark.anyio
async def test_ai_service_fetch_blocks_ssrf():
    settings = AppSettings()
    with patch("app.services.ai_service.FirecrawlApp"):
        service = AIService(settings)
        # Verify fetch raises ValueError for unsafe URL (SSRF protection)
        with pytest.raises(ValueError, match="Unsafe URL target"):
            await service.fetch_markdown_or_text("http://127.0.0.1:8000/api/settings")


# 2. CORS Allowed Origins Tests
def test_cors_origins():
    client = TestClient(app)

    # 1. Request from an allowed origin (e.g. localhost:3000)
    # Note: CORSMiddleware matches exactly or by wildcard.
    # In pre-flight options request:
    headers_allowed = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
    }
    response_allowed = client.options("/api/health", headers=headers_allowed)
    assert (
        response_allowed.headers.get("access-control-allow-origin")
        == "http://localhost:3000"
    )

    # 2. Request from a disallowed/malicious origin
    headers_malicious = {
        "Origin": "http://malicious.com",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
    }
    response_malicious = client.options("/api/health", headers=headers_malicious)
    # The access-control-allow-origin header should NOT be set, or should not equal http://malicious.com or *
    allow_origin = response_malicious.headers.get("access-control-allow-origin")
    assert allow_origin is None or (
        allow_origin != "*" and allow_origin != "http://malicious.com"
    )


# 3. File Upload Size Limit Tests
def test_image_upload_size_limit():
    client = TestClient(app)

    # Create a dummy payload larger than 15MB (e.g., 16MB of null bytes)
    large_payload = b"\x00" * (16 * 1024 * 1024)

    files = {"file": ("test.png", large_payload, "image/png")}
    data = {"provider": "gemini"}

    # Post to the analyze-image endpoint
    response = client.post("/api/models/analyze-image", files=files, data=data)

    # Should reject with HTTP 413 Payload Too Large
    assert response.status_code == 413
