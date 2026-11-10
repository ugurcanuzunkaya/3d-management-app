import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine
from app.main import app
from app.dependencies import get_session


@pytest.fixture(name="client")
def client_fixture():
    from unittest.mock import patch

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with (
        patch("paho.mqtt.client.Client"),
        patch("app.main.engine", engine),
        Session(engine) as session,
    ):
        app.dependency_overrides[get_session] = lambda: session
        with TestClient(app) as test_client:
            yield test_client
    app.dependency_overrides.clear()


def test_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_filaments_route(client: TestClient):
    response = client.get("/api/filaments")
    assert response.status_code == 200


def test_printer_status_route(client: TestClient):
    response = client.get("/api/printer/status")
    assert response.status_code == 200


def test_settings_pricing_and_export_backup(client: TestClient):
    # Update settings with full pricing parameters
    res_update = client.post(
        "/api/settings",
        json={
            "id": 1,
            "electric_price": 4.2,
            "fallback_wattage": 220.0,
            "markup_multiplier": 3.5,
            "machine_hourly_rate": 7.5,
            "failure_rate_pct": 8.0,
            "currency": "TRY",
        },
    )
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["markup_multiplier"] == pytest.approx(3.5)
    assert updated["machine_hourly_rate"] == pytest.approx(7.5)
    assert updated["failure_rate_pct"] == pytest.approx(8.0)

    # Create a printer with a secret access_code
    res_printer = client.post(
        "/api/printer",
        json={
            "name": "Bambu P2S Workshop",
            "ip_address": "192.168.1.55",
            "serial_number": "01P00A123456789",
            "access_code": "TOPSECRET999",
            "is_active": False,
        },
    )
    assert res_printer.status_code == 201

    # Export full local backup JSON
    res_export = client.get("/api/settings/export")
    assert res_export.status_code == 200
    backup = res_export.json()
    assert "settings" in backup
    assert "stock_settings" in backup
    assert "filaments" in backup
    assert "models" in backup
    assert "jobs" in backup
    assert "printers" in backup
    assert len(backup["printers"]) >= 1
    assert all(p["access_code"] == "********" for p in backup["printers"])
    assert "TOPSECRET999" not in str(backup)
