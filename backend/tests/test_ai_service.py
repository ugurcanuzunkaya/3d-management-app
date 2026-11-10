import inspect
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
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
async def test_list_ollama_models_returns_dynamic_models(ai_service):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "models": [
            {"name": "deepseek-r1:8b"},
            {"name": "llava:latest"},
        ]
    }
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client

    with patch("app.services.ai_service.httpx.AsyncClient", return_value=mock_client):
        models = await ai_service.list_ollama_models()
        assert models == ["deepseek-r1:8b", "llava:latest"]

    assert not hasattr(AppSettings(), "ollama_model_qwen")
    assert not hasattr(AppSettings(), "ollama_model_gemma")
    assert "ollama_qwen3.5" not in inspect.getsource(AIService)
    assert "ollama_gemma4" not in inspect.getsource(AIService)


@pytest.mark.anyio
async def test_extract_tech_params_uses_dynamic_ollama_model(ai_service):
    mock_chat_resp = {
        "message": {
            "content": '{"name": "Dynamic Benchy", "weight_g": 12.5, "filament_type": "PLA", "print_time_minutes": 35, "nozzle_temp": 210, "bed_temp": 60, "dimensions": "60x31x48mm", "tech_details": {}}'
        }
    }
    mock_ollama = AsyncMock()
    mock_ollama.chat.return_value = mock_chat_resp
    ai_service.ollama_client = mock_ollama

    with patch.object(
        ai_service,
        "list_ollama_models",
        new=AsyncMock(return_value=["deepseek-r1:8b"]),
    ):
        result = await ai_service.extract_tech_params_from_text(
            "Dynamic Benchy 12.5g PLA", provider="ollama:deepseek-r1:8b"
        )
        assert result.name == "Dynamic Benchy"
        assert result.weight_g == 12.5
        mock_ollama.chat.assert_called_once()
        assert mock_ollama.chat.call_args.kwargs["model"] == "deepseek-r1:8b"


def test_ollama_models_endpoint():
    with patch.object(
        AIService,
        "list_ollama_models",
        new=AsyncMock(return_value=["mistral-nemo:latest", "qwen2.5-vl:7b"]),
    ):
        client = TestClient(app)
        res = client.get("/api/models/ollama-models")
        assert res.status_code == 200
        assert res.json() == ["mistral-nemo:latest", "qwen2.5-vl:7b"]


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
