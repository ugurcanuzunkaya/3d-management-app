from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select
from app.main import app
from app.dependencies import get_session, get_mqtt_service
from app.models import Printer
from app.services.mqtt_service import BambuMQTTService
from app.config import AppSettings, get_settings


# Setup isolated database for testing
@pytest.fixture(name="test_db_session")
def session_fixture():
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    from sqlalchemy import inspect

    print("\nTABLES IN TEST ENGINE:", inspect(engine).get_table_names())
    with Session(engine) as session:
        yield session


@pytest.fixture(name="mqtt_service")
def mqtt_service_fixture():
    with patch("paho.mqtt.client.Client"):
        service = BambuMQTTService()
        yield service


@pytest.fixture(name="client")
def client_fixture(test_db_session, mqtt_service):
    def get_session_override():
        return test_db_session

    def get_mqtt_service_override():
        return mqtt_service

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[get_mqtt_service] = get_mqtt_service_override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_printer_crud_and_mqtt_registration(client, test_db_session, mqtt_service):
    # 1. Initially no printers
    response = client.get("/api/printer")
    assert response.status_code == 200
    assert response.json() == []

    # 2. Add a printer
    printer_payload = {
        "name": "Lab Printer 1",
        "ip_address": "192.168.1.100",
        "serial_number": "01P0099882211",
        "access_code": "secret123",
        "is_active": True,
    }
    response = client.post("/api/printer", json=printer_payload)
    assert response.status_code == 201
    created_printer = response.json()
    assert created_printer["id"] is not None
    assert created_printer["name"] == "Lab Printer 1"

    # Verify registered in MQTT service
    printer_id = created_printer["id"]
    assert printer_id in mqtt_service.connections
    assert mqtt_service.connections[printer_id].host == "192.168.1.100"
    assert mqtt_service.connections[printer_id].serial == "01P0099882211"

    # 3. Get status (should be empty but succeed)
    response = client.get(f"/api/printer/{printer_id}/status")
    assert response.status_code == 200
    assert response.json()["last_updated"] is None

    # Simulate receiving telemetry
    conn = mqtt_service.connections[printer_id]
    conn.last_status = {
        "gcode_state": "RUNNING",
        "percent": 65,
        "_internal_timestamp": 1716120000.0,
    }
    response = client.get(f"/api/printer/{printer_id}/status")
    assert response.status_code == 200
    assert response.json()["gcode_state"] == "RUNNING"
    assert response.json()["percent"] == 65

    # 4. Update printer (make inactive)
    updated_payload = {
        **printer_payload,
        "name": "Updated Lab Printer",
        "is_active": False,
    }
    response = client.put(f"/api/printer/{printer_id}", json=updated_payload)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Lab Printer"
    assert response.json()["is_active"] is False

    # Verify connection unregistered from MQTT
    assert printer_id not in mqtt_service.connections

    # 5. Delete printer
    response = client.delete(f"/api/printer/{printer_id}")
    assert response.status_code == 204
    assert test_db_session.get(Printer, printer_id) is None


@pytest.mark.anyio
async def test_lifespan_seeding_from_env(mqtt_service):
    # Set settings
    test_settings = AppSettings(
        bambu_printer_ip="10.0.0.5",
        bambu_printer_serial="SN12345",
        bambu_printer_access_code="code123",
    )

    def get_settings_override():
        return test_settings

    app.dependency_overrides[get_settings] = get_settings_override
    app.dependency_overrides[get_mqtt_service] = lambda: mqtt_service

    # Create empty test database
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    # Patch database engine, get_settings, and get_mqtt_service in main
    with (
        patch("app.main.engine", engine),
        patch("app.main.Session", lambda e: Session(e)),
        patch("app.main.get_settings", return_value=test_settings),
        patch("app.main.get_mqtt_service", return_value=mqtt_service),
    ):
        # Run lifespan
        from app.main import lifespan

        async with lifespan(app):
            # Verify that default printer was seeded in DB
            with Session(engine) as sess:
                printers = sess.exec(select(Printer)).all()
                assert len(printers) == 1
                assert printers[0].name == "Default Printer"
                assert printers[0].ip_address == "10.0.0.5"

            # Verify registered in MQTT
            p_id = printers[0].id
            assert p_id in mqtt_service.connections
            assert mqtt_service.connections[p_id].host == "10.0.0.5"

    app.dependency_overrides.clear()


def test_all_printers_status(client, test_db_session, mqtt_service):
    # Add two active printers and one inactive printer
    p1 = Printer(
        name="P1",
        ip_address="192.168.1.10",
        serial_number="SN001",
        access_code="code1",
        is_active=True,
    )
    p2 = Printer(
        name="P2",
        ip_address="192.168.1.11",
        serial_number="SN002",
        access_code="code2",
        is_active=True,
    )
    p3 = Printer(
        name="P3",
        ip_address="192.168.1.12",
        serial_number="SN003",
        access_code="code3",
        is_active=False,
    )
    test_db_session.add(p1)
    test_db_session.add(p2)
    test_db_session.add(p3)
    test_db_session.commit()
    test_db_session.refresh(p1)
    test_db_session.refresh(p2)
    test_db_session.refresh(p3)

    # Register them manually in fake mqtt service (since dependencies were mocked)
    mqtt_service.register_printer(
        p1.id, p1.ip_address, p1.serial_number, p1.access_code
    )
    mqtt_service.register_printer(
        p2.id, p2.ip_address, p2.serial_number, p2.access_code
    )

    # Set mock statuses
    mqtt_service.connections[p1.id].last_status = {
        "gcode_state": "RUNNING",
        "percent": 50,
        "last_updated": 100,
    }
    mqtt_service.connections[p2.id].last_status = {
        "gcode_state": "IDLE",
        "percent": 0,
        "last_updated": 200,
    }

    # Query all statuses endpoint
    response = client.get("/api/printer/status/all")
    assert response.status_code == 200
    res_data = response.json()

    # We expect p1 and p2 statuses, and p3 to be empty dictionary
    assert str(p1.id) in res_data
    assert str(p2.id) in res_data
    assert str(p3.id) in res_data

    assert res_data[str(p1.id)]["gcode_state"] == "RUNNING"
    assert res_data[str(p2.id)]["gcode_state"] == "IDLE"
    assert res_data[str(p3.id)] == {}


def test_printer_offline_on_no_response(mqtt_service):
    # 1. Register printer
    mqtt_service.register_printer(100, "192.168.1.150", "SN_OFFLINE_TEST", "secret")
    conn = mqtt_service.connections[100]

    # 2. Mock it is connected but no telemetry was ever received
    # If last_request_time was set but 15 seconds passed, it should show offline
    import time

    conn.last_request_time = (
        time.time() - 12.0
    )  # 12 seconds ago (exceeds 10s threshold)

    status = conn.get_status()
    assert status["gcode_state"] == "OFFLINE"
    assert status["online"]["ahb"] is False

    # 3. Simulate receiving data
    conn.last_status = {
        "gcode_state": "IDLE",
        "percent": 0,
        "online": {"ahb": True},
        "_internal_timestamp": time.time(),
    }
    conn.received_first_message = True

    status = conn.get_status()
    assert status["gcode_state"] == "IDLE"
    assert status["online"]["ahb"] is True
