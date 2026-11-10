import pytest
import inspect
from unittest.mock import patch
from sqlmodel import SQLModel, create_engine, Session
from app.services.ai_service import AIService
from app.services.mqtt_service import BambuMQTTService
from app.services.job_service import JobService
from app.models import (
    Filament,
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


@pytest.mark.anyio
async def test_playwright_closes_on_error(ai_service):
    with patch("app.services.ai_service.is_safe_url", return_value=True):
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
    # Seed type, color
    f_type = FilamentType(name="PLA")
    color = FilamentColor(name="Red")
    session.add(f_type)
    session.add(color)
    session.commit()

    # Seed 3 filaments
    filaments = [
        Filament(
            name=f"F{i}",
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


@pytest.mark.anyio
async def test_lifespan_initializes_fresh_uninitialized_db():
    from sqlalchemy.pool import StaticPool
    from sqlalchemy import inspect
    from app.main import app, lifespan

    fresh_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with patch("paho.mqtt.client.Client"):
        mqtt_svc = BambuMQTTService()
        with (
            patch("app.main.engine", fresh_engine),
            patch("app.database.engine", fresh_engine),
            patch("app.main.get_mqtt_service", return_value=mqtt_svc),
        ):
            async with lifespan(app):
                tables = inspect(fresh_engine).get_table_names()
                assert "printer" in tables
                assert "filament" in tables


@pytest.mark.anyio
async def test_ai_service_uses_gemini_3_8_flash():
    from unittest.mock import AsyncMock, MagicMock

    settings = AppSettings(gemini_api_key="fake-key")
    with (
        patch("app.services.ai_service.FirecrawlApp"),
        patch("app.services.ai_service.genai.Client") as mock_genai_cls,
    ):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"name": "Bench", "weight_g": 15.0, "filament_type": "PLA", "print_time_minutes": 45, "nozzle_temp": 210, "bed_temp": 60, "dimensions": null, "tech_details": {}}'
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)
        mock_genai_cls.return_value = mock_client

        service = AIService(settings)
        res = await service.extract_tech_params_from_text(
            "Bench 15g PLA", provider="gemini"
        )
        assert res.name == "Bench"
        call_kwargs = mock_client.aio.models.generate_content.call_args.kwargs
        assert call_kwargs["model"] == "gemini-3.8-flash"


def test_no_type_ignore_in_main_or_printer_router():
    import app.main as main_mod
    import app.routers.printer as printer_mod

    assert "# type: ignore" not in inspect.getsource(main_mod)
    assert "# type: ignore" not in inspect.getsource(printer_mod)


def test_init_db_adds_missing_sqlite_columns_to_existing_tables():
    from sqlalchemy.pool import StaticPool
    from sqlalchemy import inspect, text
    import app.database as db_mod

    legacy_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with legacy_engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE filament (id INTEGER PRIMARY KEY, name VARCHAR, price_per_kg FLOAT, remaining_weight_g FLOAT, is_opened BOOLEAN)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE printjob (id INTEGER PRIMARY KEY, name VARCHAR, job_type VARCHAR, duration_minutes INTEGER, total_cost FLOAT, production_cost FLOAT)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE settings (id INTEGER PRIMARY KEY, electric_price FLOAT, fallback_wattage FLOAT)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE stocksettings (id INTEGER PRIMARY KEY, default_price_per_kg FLOAT, default_weight_g FLOAT)"
            )
        )

    with patch.object(db_mod, "engine", legacy_engine):
        db_mod.init_db()

    insp = inspect(legacy_engine)
    filament_cols = {c["name"] for c in insp.get_columns("filament")}
    assert {"brand", "initial_weight_g", "empty_spool_weight_g"}.issubset(filament_cols)

    job_cols = {c["name"] for c in insp.get_columns("printjob")}
    assert {"printer_id", "external_job_id", "status"}.issubset(job_cols)

    settings_cols = {c["name"] for c in insp.get_columns("settings")}
    assert {
        "markup_multiplier",
        "machine_hourly_rate",
        "failure_rate_pct",
        "currency",
    }.issubset(settings_cols)

    stock_cols = {c["name"] for c in insp.get_columns("stocksettings")}
    assert "low_stock_threshold" in stock_cols
