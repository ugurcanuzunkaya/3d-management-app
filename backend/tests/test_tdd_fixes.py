import pytest
import inspect
from unittest.mock import patch
from sqlmodel import SQLModel, create_engine, Session
from app.services.ai_service import AIService
from app.services.mqtt_service import BambuMQTTService
from app.services.job_service import JobService
from app.models import (
    Filament,
    FilamentSeries,
    FilamentType,
    FilamentColor,
    PrintJob,
    JobFilament,
)
from app.config import AppSettings


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def ai_service():
    settings = AppSettings()
    with patch("app.services.ai_service.FirecrawlApp"):
        service = AIService(settings)
        return service


# 1. Playwright Process Leak Test
@pytest.mark.anyio
async def test_playwright_closes_on_error(ai_service):
    with patch("app.services.ai_service.async_playwright") as mock_playwright:
        mock_p_instance = mock_playwright.return_value.__aenter__.return_value
        mock_browser = mock_p_instance.chromium.launch.return_value

        # Make new_context raise an exception
        mock_browser.new_context.side_effect = Exception("Playwright context crash")

        await ai_service.fetch_markdown_or_text("http://fail-url.com")

        # Assert that browser.close was still called!
        mock_browser.close.assert_called_once()


# 2. Async AI Extraction Methods check
def test_ai_service_methods_are_async(ai_service):
    assert inspect.iscoroutinefunction(ai_service.extract_tech_params_from_text)
    assert inspect.iscoroutinefunction(ai_service.extract_tech_params_from_image)


# 3. SQL N+1 Query Check for Job Bulk Delete
def test_delete_all_jobs_n_plus_one(session: Session):
    # Seed type, color, series
    series = FilamentSeries(name="Test Series", nozzle_temp="200", bed_temp="60")
    f_type = FilamentType(name="PLA")
    color = FilamentColor(name="Red")
    session.add(series)
    session.add(f_type)
    session.add(color)
    session.commit()

    # Seed 3 filaments
    filaments = [
        Filament(
            name=f"F{i}",
            series_id=series.id,
            type_id=f_type.id,
            color_id=color.id,
            price_per_kg=100.0,
            remaining_weight_g=500.0,
        )
        for i in range(3)
    ]
    for f in filaments:
        session.add(f)
    session.commit()

    # Seed 5 print jobs with filaments
    jobs = []
    for i in range(5):
        job = PrintJob(
            name=f"Job {i}",
            job_type="Generic",
            duration_minutes=60,
            total_cost=20.0,
            production_cost=10.0,
        )
        session.add(job)
        session.commit()
        # Add link
        link = JobFilament(
            job_id=job.id, filament_id=filaments[i % 3].id, grams_used=50.0
        )
        session.add(link)
        session.commit()
        jobs.append(job)

    # Spy on session.get to ensure we don't query filaments one by one
    get_calls = []
    original_get = session.get

    def spy_get(model, ident, **kwargs):
        if model == Filament:
            get_calls.append(ident)
        return original_get(model, ident, **kwargs)

    with patch.object(session, "get", side_effect=spy_get):
        # Run the bulk delete
        JobService.delete_all_jobs(session)

    # If optimized, we should not do N+1 session.get calls for filaments.
    # The original code called session.get for every job's filament links (5 times).
    # We assert that session.get is not called for Filaments at all (or called 0 times).
    assert len(get_calls) == 0, (
        f"Expected 0 session.get calls for Filament, got {len(get_calls)}"
    )


def test_mqtt_status_timestamp():
    with patch("paho.mqtt.client.Client"):
        service = BambuMQTTService()
        service.register_printer(1, "192.168.1.100", "serial123", "secret")

        # Case 1: empty status
        assert service.get_status(1).get("last_updated") is None

        # Case 2: status has message
        fake_timestamp = 1716120000.0
        service.connections[1].last_status = {
            "gcode_state": "RUNNING",
            "_internal_timestamp": fake_timestamp,
        }

        status = service.get_status(1)
        assert status.get("last_updated") == fake_timestamp
