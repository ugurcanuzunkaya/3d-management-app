import pytest
from unittest.mock import patch
from app.services.ai_service import AIService
from app.config import AppSettings
from app.schemas.model3d import ModelExtractionResult


@pytest.fixture
def ai_service():
    settings = AppSettings()
    with patch("app.services.ai_service.FirecrawlApp"):
        service = AIService(settings)
        return service


@pytest.mark.anyio
async def test_extract_tech_params_from_text(ai_service):
    mock_result = ModelExtractionResult(
        name="Test Model",
        weight_g=50.0,
        filament_type="PLA",
        print_time_minutes=120,
        nozzle_temp=210,
        bed_temp=60,
        dimensions="100x100x100mm",
        tech_details={},
    )

    async def mock_coro(*args, **kwargs):
        return mock_result

    with patch.object(
        ai_service, "extract_tech_params_from_text", side_effect=mock_coro
    ):
        params = await ai_service.extract_tech_params_from_text(
            "This model weighs 50g and uses PLA."
        )
        assert params.weight_g == 50.0
        assert params.filament_type == "PLA"
        assert params.print_time_minutes == 120
        assert params.name == "Test Model"


@pytest.mark.anyio
async def test_fetch_markdown_or_text_failure(ai_service):
    ai_service.firecrawl_app = None
    with patch("app.services.ai_service.is_safe_url", return_value=True):
        with patch("app.services.ai_service.async_playwright") as mock_playwright:
            mock_playwright.return_value.__aenter__.side_effect = Exception(
                "Playwright failed"
            )
            res = await ai_service.fetch_markdown_or_text("http://test.com")
            assert res is None
