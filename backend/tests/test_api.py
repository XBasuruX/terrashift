from fastapi.testclient import TestClient
from backend.main import app
from backend.contracts import Farm
from backend.providers import service
import httpx

client = TestClient(app)


def body():
    farm = Farm(latitude=8.3114, longitude=80.4037)
    return {
        "farm": farm.model_dump(),
        "climate": {
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "start": "2024-01-01",
            "end": "2024-12-31",
            "mode": "cached",
        },
        "scenario": {"kind": "typical", "temperature_delta": 0, "rainfall_factor": 1},
    }


def test_health_catalog_and_openapi():
    assert client.get("/api/health").json()["status"] == "ok"
    assert len(client.get("/api/catalog").json()["sources"]) == 6
    assert "/api/analyze" in client.get("/openapi.json").json()["paths"]


def test_climate_contract_from_actual_fixture():
    r = client.post("/api/climate", json=body()["climate"])
    assert r.status_code == 200
    d = r.json()
    assert len(d["monthly"]) == 12 and len(d["daily"]) == 366
    assert d["provenance"]["mode"] == "cached"
    assert d["summary"]["coverage"] == 1


def test_analysis_contract_and_changed_scenario():
    b = body()
    a = client.post("/api/analyze", json=b)
    assert a.status_code == 200, a.text
    assert len(a.json()["rotations"]) == 3
    b["scenario"].update(temperature_delta=4, rainfall_factor=0.2)
    d = client.post("/api/analyze", json=b).json()
    assert (
        d["rotations"][0]["water_deficit_mm"]
        > a.json()["rotations"][0]["water_deficit_mm"]
    )
    assert d["farm"]["name"] == b["farm"]["name"]


def test_errors_are_structured_422():
    b = body()
    b["farm"]["latitude"] = 10
    assert client.post("/api/analyze", json=b).status_code == 422
    b = body()
    b["farm"]["existing"][0] = "unknown"
    r = client.post("/api/analyze", json=b)
    assert r.status_code == 422 and "Unknown crop" in r.json()["detail"]
    b = body()
    b["farm"]["priorities"] = {"water": 0, "diversity": 0, "suitability": 0}
    assert client.post("/api/analyze", json=b).status_code == 422


def test_live_outage_falls_back_to_genuine_cache(monkeypatch):
    class BrokenClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def get(self, *args, **kwargs):
            raise httpx.ConnectError("offline")

    monkeypatch.setattr(service.httpx, "AsyncClient", BrokenClient)
    q = body()["climate"]
    q["mode"] = "live"
    d = client.post("/api/climate", json=q).json()
    assert d["provenance"]["mode"] == "cached"
    assert "Live POWER unavailable" in d["provenance"]["warning"]


def test_incomplete_window_has_climate_but_no_rotation():
    b = body()
    b["climate"].update(start="2024-01-01", end="2024-01-31")
    assert client.post("/api/climate", json=b["climate"]).status_code == 200
    r = client.post("/api/analyze", json=b)
    assert r.status_code == 422 and "Complete daily" in r.json()["detail"]


def test_zero_weighted_output_is_a_valid_response():
    b = body()
    b["farm"]["latitude"] = 85
    b["climate"]["latitude"] = 85
    b["climate"]["mode"] = "simulation"
    b["farm"]["priorities"] = {"water": 0, "diversity": 0, "suitability": 100}
    r = client.post("/api/analyze", json=b)
    assert r.status_code == 200, r.text
    assert r.json()["rotations"][0]["score"] == 0
