import json
from types import SimpleNamespace
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine, select
from app.main import app
from app.dependencies import get_session, get_mqtt_service
from app.models import (
    Filament,
    FilamentColor,
    FilamentType,
    Model3D,
    Printer,
    PrinterSlotAssignment,
    PrintJob,
)
from app.services.mqtt_service import BambuMQTTService


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


@pytest.fixture(name="mqtt_service")
def mqtt_service_fixture(test_db_session):
    with patch("paho.mqtt.client.Client"):
        service = BambuMQTTService(session_factory=lambda: test_db_session)
        yield service


@pytest.fixture(name="client")
def client_fixture(test_db_session, mqtt_service):
    app.dependency_overrides[get_session] = lambda: test_db_session
    app.dependency_overrides[get_mqtt_service] = lambda: mqtt_service
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_pending_job_does_not_deduct_stock_until_approved(client, test_db_session):
    pla = FilamentType(name="PLA", is_custom=False)
    grey = FilamentColor(name="Grey", hex_code="#DCDCDC")
    test_db_session.add_all([pla, grey])
    test_db_session.commit()
    test_db_session.refresh(pla)
    test_db_session.refresh(grey)

    spool = Filament(
        name="eSUN PLA+ Grey",
        type_id=pla.id,
        color_id=grey.id,
        price_per_kg=600.0,
        remaining_weight_g=500.0,
        is_opened=True,
    )
    test_db_session.add(spool)
    test_db_session.commit()
    test_db_session.refresh(spool)
    assert spool.id is not None

    # 1. Create a pending job -> must NOT deduct from spool.remaining_weight_g
    create_res = client.post(
        "/api/printjobs",
        json={
            "name": "Articulated Dragon",
            "job_type": "Completed Print",
            "duration_minutes": 180,
            "total_cost": 0.0,
            "production_cost": 0.0,
            "status": "pending",
            "filaments": [{"filament_id": spool.id, "grams_used": 65.0}],
        },
    )
    assert create_res.status_code == 200
    job_data = create_res.json()
    job_id = job_data["id"]
    assert job_data["status"] == "pending"

    test_db_session.refresh(spool)
    assert spool.remaining_weight_g == 500.0

    # 2. Approve the pending job with edited grams_used=75.0 and total_cost=240.0
    approve_res = client.post(
        f"/api/printjobs/{job_id}/approve",
        json={
            "total_cost": 240.0,
            "production_cost": 55.0,
            "filaments": [{"filament_id": spool.id, "grams_used": 75.0}],
        },
    )
    assert approve_res.status_code == 200
    approved = approve_res.json()
    assert approved["status"] == "completed"
    assert approved["total_cost"] == 240.0

    test_db_session.refresh(spool)
    assert spool.remaining_weight_g == 425.0


def test_mqtt_running_to_finish_creates_deduplicated_pending_job_with_smart_model_match(
    client, test_db_session, mqtt_service
):
    pla = FilamentType(name="PLA", is_custom=False)
    red = FilamentColor(name="Red", hex_code="#F72323")
    test_db_session.add_all([pla, red])
    test_db_session.commit()
    test_db_session.refresh(pla)
    test_db_session.refresh(red)

    spool = Filament(
        name="3Doyuncu PLA Red",
        type_id=pla.id,
        color_id=red.id,
        price_per_kg=550.0,
        remaining_weight_g=800.0,
        is_opened=True,
    )
    model = Model3D(
        name="Gridfinity 2x3 Bin",
        estimated_weight_g=48.5,
        tech_details={"print_time_minutes": 90},
    )
    printer = Printer(
        name="Bambu Lab P2S",
        ip_address="192.168.1.50",
        serial_number="22E8BA572201450",
        access_code="secret123",
        is_active=True,
    )
    test_db_session.add_all([spool, model, printer])
    test_db_session.commit()
    test_db_session.refresh(spool)
    test_db_session.refresh(model)
    test_db_session.refresh(printer)
    assert printer.id is not None
    assert spool.id is not None
    assert model.id is not None

    # Mount spool in AMS Slot 0
    assignment = PrinterSlotAssignment(
        printer_id=printer.id,
        slot_index=0,
        filament_id=spool.id,
    )
    test_db_session.add(assignment)
    test_db_session.commit()

    mqtt_service.register_printer(
        printer.id, printer.ip_address, printer.serial_number, printer.access_code
    )
    conn = mqtt_service.connections[printer.id]

    # Step 1: RUNNING message
    msg_running = SimpleNamespace(
        payload=json.dumps(
            {
                "print": {
                    "gcode_state": "RUNNING",
                    "subtask_id": "952420398",
                    "subtask_name": "Gridfinity 2x3 Bin",
                    "mc_remaining_time": 0,
                    "ams": {"tray_now": "0"},
                }
            }
        ).encode()
    )
    conn.on_message(conn.client, None, msg_running)

    # Step 2: Transition RUNNING -> FINISH
    msg_finish = SimpleNamespace(
        payload=json.dumps(
            {
                "print": {
                    "gcode_state": "FINISH",
                    "subtask_id": "952420398",
                    "subtask_name": "Gridfinity 2x3 Bin",
                }
            }
        ).encode()
    )
    conn.on_message(conn.client, None, msg_finish)

    # Step 3: Subsequent FINISH message with same subtask_id -> must NOT duplicate
    conn.on_message(conn.client, None, msg_finish)

    pending_jobs = test_db_session.exec(
        select(PrintJob).where(PrintJob.status == "pending")
    ).all()
    assert len(pending_jobs) == 1
    p_job = pending_jobs[0]
    assert p_job.name == "Gridfinity 2x3 Bin"
    assert p_job.printer_id == printer.id
    assert p_job.external_job_id == "952420398"
    assert p_job.model_id == model.id
    assert p_job.duration_minutes == 90
    assert p_job.production_cost > 0
    assert len(p_job.job_filaments) == 1
    assert p_job.job_filaments[0].filament_id == spool.id
    assert p_job.job_filaments[0].grams_used == 48.5

    # Filament stock must still be untouched at 800.0g while pending
    test_db_session.refresh(spool)
    assert spool.remaining_weight_g == 800.0

    # Approving without manual total_cost/production_cost auto-calculates via CostService
    approve_res = client.post(
        f"/api/printjobs/{p_job.id}/approve",
        json={"filaments": [{"filament_id": spool.id, "grams_used": 50.0}]},
    )
    assert approve_res.status_code == 200
    approved_job = approve_res.json()
    assert approved_job["status"] == "completed"
    assert approved_job["production_cost"] > 0
    assert approved_job["total_cost"] > 0
