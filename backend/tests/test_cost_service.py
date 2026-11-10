import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine
from app.main import app
from app.dependencies import get_session
from app.models import Filament, FilamentColor, FilamentType, Settings
from app.services.cost_service import CostService


@pytest.fixture(name="test_db_session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(test_db_session):
    from unittest.mock import patch
    from app.dependencies import get_mqtt_service
    from app.services.mqtt_service import BambuMQTTService

    with patch("paho.mqtt.client.Client"):
        fake_mqtt = BambuMQTTService()
        app.dependency_overrides[get_session] = lambda: test_db_session
        app.dependency_overrides[get_mqtt_service] = lambda: fake_mqtt
        with (
            patch("app.main.engine", test_db_session.get_bind()),
            patch("app.main.get_mqtt_service", return_value=fake_mqtt),
            TestClient(app) as client,
        ):
            yield client
    app.dependency_overrides.clear()


def test_calculate_production_cost():
    cost = CostService.calculate_production_cost(
        used_filament_g=100.0,
        filament_price_per_kg=500.0,
        duration_minutes=60,
        power_usage_kwh=0.0,
        electric_price=2.0,
        fallback_wattage=350.0,
    )
    assert round(cost, 2) == 50.70


def test_calculate_total_price():
    production_cost = 50.0
    total = CostService.calculate_total_price(
        production_cost=production_cost, custom_costs=[{"name": "Box", "value": 10.0}]
    )
    assert total == 160.0


def test_cost_service_multi_filament_and_full_pricing_formula(test_db_session):
    settings = Settings(
        electric_price=3.0,
        fallback_wattage=200.0,
        markup_multiplier=2.5,
        machine_hourly_rate=10.0,
        failure_rate_pct=10.0,
        currency="TRY",
    )
    test_db_session.add(settings)
    pla = FilamentType(name="PLA", is_custom=False)
    grey = FilamentColor(name="Grey", hex_code="#808080")
    test_db_session.add_all([pla, grey])
    test_db_session.commit()
    test_db_session.refresh(pla)
    test_db_session.refresh(grey)

    f1 = Filament(
        name="Spool 1",
        type_id=pla.id,
        color_id=grey.id,
        price_per_kg=600.0,
        remaining_weight_g=1000.0,
    )
    f2 = Filament(
        name="Spool 2",
        type_id=pla.id,
        color_id=grey.id,
        price_per_kg=1000.0,
        remaining_weight_g=1000.0,
    )
    test_db_session.add_all([f1, f2])
    test_db_session.commit()
    test_db_session.refresh(f1)
    test_db_session.refresh(f2)
    assert f1.id is not None
    assert f2.id is not None

    breakdown = CostService.calculate_job_breakdown(
        session=test_db_session,
        filaments=[
            {"filament_id": f1.id, "grams_used": 50.0},
            {"filament_id": f2.id, "grams_used": 20.0},
        ],
        duration_minutes=120,
        custom_costs=[{"name": "Packaging", "value": 15.0}],
    )

    assert round(breakdown["filament_cost"], 2) == 50.00
    assert round(breakdown["electricity_cost"], 2) == 1.20
    assert round(breakdown["machine_wear_cost"], 2) == 20.00
    assert round(breakdown["failure_buffer_cost"], 2) == 7.12
    assert round(breakdown["production_cost"], 2) == 78.32
    assert round(breakdown["suggested_price"], 2) == 195.80
    assert round(breakdown["custom_costs_total"], 2) == 15.00
    assert round(breakdown["final_total_price"], 2) == 210.80
    assert round(breakdown["net_profit"], 2) == 117.48
    assert breakdown["margin_pct"] > 50.0


def test_calculate_cost_endpoint_and_auto_job_costing(client, test_db_session):
    settings = Settings(
        electric_price=2.0,
        fallback_wattage=200.0,
        markup_multiplier=3.0,
        machine_hourly_rate=5.0,
        failure_rate_pct=0.0,
        currency="TRY",
    )
    pla = FilamentType(name="PLA", is_custom=False)
    grey = FilamentColor(name="Grey", hex_code="#808080")
    test_db_session.add_all([settings, pla, grey])
    test_db_session.commit()
    test_db_session.refresh(pla)
    test_db_session.refresh(grey)

    spool = Filament(
        name="eSUN PLA",
        type_id=pla.id,
        color_id=grey.id,
        price_per_kg=500.0,
        remaining_weight_g=1000.0,
    )
    test_db_session.add(spool)
    test_db_session.commit()
    test_db_session.refresh(spool)
    assert spool.id is not None

    # 1. Quote endpoint
    quote_res = client.post(
        "/api/printjobs/calculate-cost",
        json={
            "duration_minutes": 60,
            "filaments": [{"filament_id": spool.id, "grams_used": 100.0}],
            "custom_costs": [{"name": "Magnets", "value": 10.0}],
        },
    )
    assert quote_res.status_code == 200
    q = quote_res.json()
    # 100g @ 500 = 50.0, 1h @ 0.2kW * 2 = 0.4, 1h @ 5.0 = 5.0 -> prod = 55.4
    assert round(q["production_cost"], 2) == 55.40
    # 55.4 * 3 + 10 = 176.2
    assert round(q["final_total_price"], 2) == 176.20

    # 2. Creating job with 0 production_cost & 0 total_cost auto-populates via CostService
    job_res = client.post(
        "/api/printjobs",
        json={
            "name": "Auto Costed Job",
            "job_type": "Generic",
            "duration_minutes": 60,
            "total_cost": 0.0,
            "production_cost": 0.0,
            "filaments": [{"filament_id": spool.id, "grams_used": 100.0}],
        },
    )
    assert job_res.status_code == 200
    job = job_res.json()
    assert round(job["production_cost"], 2) == 55.40
    assert round(job["total_cost"], 2) == 166.20
