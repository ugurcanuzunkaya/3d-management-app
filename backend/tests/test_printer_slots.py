import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine
from app.main import app
from app.dependencies import get_session, get_mqtt_service
from app.models import Filament, FilamentColor, FilamentType, Printer
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
def mqtt_service_fixture():
    with patch("paho.mqtt.client.Client"):
        service = BambuMQTTService()
        yield service


@pytest.fixture(name="client")
def client_fixture(test_db_session, mqtt_service):
    app.dependency_overrides[get_session] = lambda: test_db_session
    app.dependency_overrides[get_mqtt_service] = lambda: mqtt_service
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_assign_ams_and_external_slots_with_two_way_mqtt_sync(
    client, test_db_session, mqtt_service
):
    pla_type = FilamentType(name="PLA", is_custom=False)
    petg_type = FilamentType(name="PETG", is_custom=False)
    grey_color = FilamentColor(name="Ash Grey", hex_code="#DCDCDC")
    black_color = FilamentColor(name="Matte Black", hex_code="#1A1A1A")
    test_db_session.add_all([pla_type, petg_type, grey_color, black_color])
    test_db_session.commit()
    test_db_session.refresh(pla_type)
    test_db_session.refresh(petg_type)
    test_db_session.refresh(grey_color)
    test_db_session.refresh(black_color)

    spool_pla = Filament(
        name="eSUN PLA+ Grey",
        type_id=pla_type.id,
        color_id=grey_color.id,
        price_per_kg=600.0,
        remaining_weight_g=420.0,
        is_opened=True,
    )
    spool_petg = Filament(
        name="Polymaker PETG Black",
        type_id=petg_type.id,
        color_id=black_color.id,
        price_per_kg=750.0,
        remaining_weight_g=80.0,  # Below default 100g threshold -> low stock!
        is_opened=True,
    )
    printer = Printer(
        name="Bambu Lab P2S",
        ip_address="192.168.1.50",
        serial_number="22E8BA572201450",
        access_code="secret123",
        is_active=True,
    )
    test_db_session.add_all([spool_pla, spool_petg, printer])
    test_db_session.commit()
    test_db_session.refresh(spool_pla)
    test_db_session.refresh(spool_petg)
    test_db_session.refresh(printer)

    assert printer.id is not None
    assert spool_pla.id is not None
    assert spool_petg.id is not None

    mqtt_service.register_printer(
        printer.id, printer.ip_address, printer.serial_number, printer.access_code
    )
    conn = mqtt_service.connections[printer.id]

    # Feed real P2S telemetry from printer_data_dump.json
    dump_path = Path(__file__).resolve().parent.parent / "printer_data_dump.json"
    raw_dump = json.loads(dump_path.read_text())
    for packet in raw_dump:
        msg = SimpleNamespace(payload=json.dumps(packet["payload"]).encode())
        conn.on_message(conn.client, None, msg)

    # 1. Assign spool_pla to AMS Slot 0
    res_slot0 = client.put(
        f"/api/printer/{printer.id}/slots/0",
        json={"filament_id": spool_pla.id},
    )
    assert res_slot0.status_code == 200
    slot0_data = res_slot0.json()
    assert slot0_data["slot_index"] == 0
    assert slot0_data["filament_id"] == spool_pla.id
    assert slot0_data["filament"]["name"] == "eSUN PLA+ Grey"
    assert slot0_data["filament"]["color_hex"] == "#DCDCDC"
    assert slot0_data["filament"]["is_low_stock"] is False

    # Verify Two-Way MQTT publish of ams_filament_setting
    assert conn.client.publish.called
    topic, payload_str = conn.client.publish.call_args[0][:2]
    assert topic == "device/22E8BA572201450/request"
    published_cmd = json.loads(payload_str)
    assert published_cmd["print"]["command"] == "ams_filament_setting"
    assert published_cmd["print"]["ams_id"] == 0
    assert published_cmd["print"]["tray_id"] == 0
    assert published_cmd["print"]["tray_color"] == "DCDCDCFF"
    assert published_cmd["print"]["tray_type"] == "PLA"

    # 2. Assign spool_petg to External Holder (slot 254)
    res_ext = client.put(
        f"/api/printer/{printer.id}/slots/254",
        json={"filament_id": spool_petg.id},
    )
    assert res_ext.status_code == 200
    ext_data = res_ext.json()
    assert ext_data["slot_index"] == 254
    assert ext_data["slot_type"] == "external"
    assert ext_data["filament_id"] == spool_petg.id
    assert ext_data["filament"]["is_low_stock"] is True

    # Verify External Spool MQTT command uses ams_id=255, tray_id=254
    topic_ext, payload_ext = conn.client.publish.call_args[0][:2]
    assert topic_ext == "device/22E8BA572201450/request"
    cmd_ext = json.loads(payload_ext)
    assert cmd_ext["print"]["ams_id"] == 255
    assert cmd_ext["print"]["tray_id"] == 254
    assert cmd_ext["print"]["tray_color"] == "1A1A1AFF"
    assert cmd_ext["print"]["tray_type"] == "PETG"

    # 3. Reassign spool_pla from Slot 0 to Slot 1 -> must auto-unmount from Slot 0
    res_slot1 = client.put(
        f"/api/printer/{printer.id}/slots/1",
        json={"filament_id": spool_pla.id},
    )
    assert res_slot1.status_code == 200

    slots_res = client.get(f"/api/printer/{printer.id}/slots")
    assert slots_res.status_code == 200
    slots = slots_res.json()
    assert len(slots) == 5
    by_idx = {s["slot_index"]: s for s in slots}
    assert by_idx[0]["filament_id"] is None
    assert by_idx[0]["ams_telemetry"]["is_active_tray"] is True
    assert by_idx[0]["ams_telemetry"]["tray_type"] == "PLA"
    assert by_idx[1]["filament_id"] == spool_pla.id
    assert by_idx[254]["filament_id"] == spool_petg.id

    # 4. Deleting spool_petg clears its slot assignment cleanly
    del_res = client.delete(f"/api/filaments/{spool_petg.id}")
    assert del_res.status_code == 200

    slots_after_del = client.get(f"/api/printer/{printer.id}/slots").json()
    by_idx_after = {s["slot_index"]: s for s in slots_after_del}
    assert by_idx_after[254]["filament_id"] is None
