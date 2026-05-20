from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_privacy_presets_lifecycle():
    # 1. List presets (should be empty or have some pre-existing ones)
    response = client.get("/api/privacy-presets", params={"page_path": "/dashboard"})
    assert response.status_code == 200
    initial_presets = response.json()
    assert isinstance(initial_presets, list)

    # 2. Create a new preset
    preset_data = {
        "name": "Test Preset",
        "page_path": "/dashboard",
        "settings": {"maskElectricPrice": True, "maskTitle": False},
    }
    response = client.post("/api/privacy-presets", json=preset_data)
    assert response.status_code == 200
    created_preset = response.json()
    assert created_preset["name"] == "Test Preset"
    assert created_preset["page_path"] == "/dashboard"
    assert created_preset["settings"] == {"maskElectricPrice": True, "maskTitle": False}
    assert "id" in created_preset

    preset_id = created_preset["id"]

    # 3. List presets again to verify it is there
    response = client.get("/api/privacy-presets", params={"page_path": "/dashboard"})
    assert response.status_code == 200
    presets = response.json()
    matching_presets = [p for p in presets if p["id"] == preset_id]
    assert len(matching_presets) == 1
    assert matching_presets[0]["name"] == "Test Preset"

    # 4. Delete the preset
    response = client.delete(f"/api/privacy-presets/{preset_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "Preset deleted successfully"}

    # 5. Verify it is gone
    response = client.get("/api/privacy-presets", params={"page_path": "/dashboard"})
    assert response.status_code == 200
    presets_after = response.json()
    matching_presets_after = [p for p in presets_after if p["id"] == preset_id]
    assert len(matching_presets_after) == 0
