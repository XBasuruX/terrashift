import asyncio, json
from pathlib import Path
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app
from backend.spectral import normalized_difference, reflectance
import pytest
from backend import vector_maps


def test_normalized_difference_zero_and_known_values():
    a = np.array([0.3, 0.1, 0.0], dtype="float32")
    b = np.array([0.1, 0.3, 0.0], dtype="float32")
    d = normalized_difference(a, b)
    assert np.allclose(d[:2], [0.5, -0.5]) and np.isnan(d[2])


def test_real_asset_radiometry_applies_offset_and_nodata_before_index():
    fixture = json.loads(
        (Path(__file__).parents[1] / "fixtures/sentinel_search.json").read_text()
    )
    metadata = fixture["features"][0]["assets"]["green"]["raster:bands"][0]
    values = reflectance(np.array([0, 3000, 5000], dtype="float32"), metadata)
    assert np.isnan(values[0])
    assert np.allclose(values[1:], [0.2, 0.4])
    assert np.allclose(normalized_difference(values[1:2], values[2:3]), [-1 / 3])


def test_missing_radiometry_is_not_silently_guessed():
    with pytest.raises(ValueError, match="scale/offset"):
        reflectance(np.array([3000]), {"scale": 0.0001})


def test_detail_and_product_contracts_reject_invalid_requests():
    c = TestClient(app)
    assert (
        c.get("/api/land/vectors/999", params={"bbox": "80,8,81,9"}).status_code == 404
    )
    assert (
        c.get("/api/land/vectors/24", params={"bbox": "0,0,30,30"}).status_code == 422
    )
    assert (
        c.get(
            "/api/land/vectors/24", params={"bbox": "80,8,81,9", "detail": "invented"}
        ).status_code
        == 422
    )
    assert (
        c.get(
            "/api/land/sentinel/image",
            params={"scene": "x", "bbox": "80,8,81,9", "sampling": 1},
        ).status_code
        == 422
    )


def test_nsdi_vectors_are_clipped_and_metadata_keeps_scale_honest(monkeypatch):
    data = json.loads(
        (Path(__file__).parents[1] / "fixtures/nsdi_soil_geometry.json").read_text()
    )

    class Response:
        def raise_for_status(self):
            pass

        def json(self):
            return data

    class Client:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            pass

        async def get(self, *a, **k):
            return Response()

    monkeypatch.setattr(vector_maps.httpx, "AsyncClient", Client)
    r = asyncio.run(vector_maps.vectors(24, "80.38,8.29,80.43,8.34", "native"))
    from shapely.geometry import shape, box

    assert r["features"]
    assert all(
        shape(f["geometry"]).difference(box(80.38, 8.29, 80.43, 8.34)).area < 1e-12
        for f in r["features"]
    )
    assert r["metadata"]["simplification_degrees"] == 0
    assert "unverified" in r["metadata"]["source_resolution"]
