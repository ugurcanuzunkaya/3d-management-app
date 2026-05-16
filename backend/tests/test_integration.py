from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_filaments_route():
    response = client.get("/api/filaments")
    assert response.status_code == 200


def test_printer_status_route():
    response = client.get("/api/printer/status")
    # This might fail if MQTT is not mockable easily, but let's see
    assert response.status_code == 200
