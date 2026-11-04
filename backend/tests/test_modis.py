import json
from pathlib import Path
from fastapi.testclient import TestClient
from backend.providers.modis import parse_modis, NDVI, QUALITY, RELIABILITY
from backend.main import app


def test_actual_ornl_response_retains_but_rejects_low_quality():
    payload = json.loads(
        (
            Path(__file__).resolve().parents[1] / "fixtures/modis_allbands_sample.json"
        ).read_text()
    )
    rows = parse_modis([payload])
    assert len(rows) == 2
    assert rows[0]["raw_ndvi"] == 0.6801
    assert rows[0]["pixel_reliability"] == 1
    assert rows[0]["ndvi"] is None


def test_scale_quality_fill_and_duplicate_dates():
    def payload(raw, rel, qa):
        return dict(
            nrows=1,
            ncols=1,
            subset=[
                dict(calendar_date="2024-01-01", band=b, data=[v])
                for b, v in [(NDVI, raw), (RELIABILITY, rel), (QUALITY, qa)]
            ],
        )

    assert parse_modis([payload(5000, 0, 0)])[0]["ndvi"] == 0.5
    assert parse_modis([payload(-3000, 0, 0)])[0]["ndvi"] is None
    assert parse_modis([payload(5000, 0, 1 << 15)])[0]["ndvi"] is None
    assert parse_modis([payload(5000, 0, 0), payload(5000, 0, 0)])[0]["ndvi"] == 0.5
    assert len(parse_modis([payload(5000, 0, 0), payload(5000, 0, 0)])) == 1


def test_vegetation_simulation_does_not_fabricate_ndvi():
    r = TestClient(app).post(
        "/api/vegetation",
        json=dict(
            latitude=8.3114,
            longitude=80.4037,
            start="2024-01-01",
            end="2024-12-31",
            mode="simulation",
        ),
    )
    assert (
        r.status_code == 200
        and r.json()["records"] == []
        and r.json()["mode"] == "unavailable"
    )


def test_genuine_vegetation_cache_contract():
    r = TestClient(app).post(
        "/api/vegetation",
        json=dict(
            latitude=8.3114,
            longitude=80.4037,
            start="2023-01-01",
            end="2025-12-31",
            mode="cached",
        ),
    )
    assert r.status_code == 200
    d = r.json()
    assert d["mode"] == "cached" and len(d["records"]) == 69
    assert d["accepted"] == 14 and d["rejected"] == 55
