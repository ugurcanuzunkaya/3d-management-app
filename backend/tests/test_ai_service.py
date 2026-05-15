import pytest
from unittest.mock import patch
from app.services.ai_service import AIService


@pytest.fixture
def ai_service():
    with patch("app.services.ai_service.FirecrawlApp"):
        service = AIService()
        return service


def test_extract_tech_params(ai_service):
    mock_markdown = "This model weighs 50g and uses PLA. Print time is 2 hours."
    mock_response = {
        "response": '{"weight_g": 50.0, "filament_type": "PLA", "print_time_minutes": 120}'
    }

    with patch("ollama.generate", return_value=mock_response):
        params = ai_service.extract_tech_params(mock_markdown)
        assert params["weight_g"] == 50.0
        assert params["filament_type"] == "PLA"
        assert params["print_time_minutes"] == 120


def test_fetch_markdown_failure(ai_service):
    # If FirecrawlApp is None (key not set)
    ai_service.firecrawl_app = None
    assert ai_service.fetch_markdown("http://test.com") is None
