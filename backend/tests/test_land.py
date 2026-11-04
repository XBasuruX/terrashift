import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.land import LAYERS, render_image


def test_allowlisted_layers_match_actual_metadata():
    metadata = json.loads(
        (Path(__file__).parents[1] / "fixtures/nsdi_agriculture.json").read_text()
    )
    actual = {x["id"]: x["name"] for x in metadata["layers"]}
    assert set(LAYERS) <= actual.keys()
    assert actual[24] == "Soil" and actual[34] == "Agro Ecological Zones"


def test_invalid_scene_cannot_be_used_as_arbitrary_remote_url():
    r = TestClient(app).get(
        "/api/land/sentinel/image",
        params={"scene": "https://example.com", "bbox": "80,8,81,9"},
    )
    assert r.status_code == 422


def test_raster_crop_math_with_local_georeferenced_fixture(tmp_path):
    import numpy as np
    import rasterio
    from rasterio.transform import from_bounds

    # Test source windowing/reprojection without relying on a live service.
    p = tmp_path / "source.tif"
    with rasterio.open(
        p,
        "w",
        driver="GTiff",
        width=100,
        height=100,
        count=3,
        dtype="uint8",
        crs="EPSG:4326",
        transform=from_bounds(80, 8, 80.01, 8.01, 100, 100),
    ) as dst:
        dst.write(np.full((3, 100, 100), 120, dtype=np.uint8))
    with pytest.raises(ValueError, match="extent"):
        render_image(str(p), [80, 8, 82, 10])
    from PIL import Image
    import io

    im = Image.open(io.BytesIO(render_image(str(p), [80.001, 8.001, 80.009, 8.009])))
    assert im.getpixel((im.width // 2, im.height // 2)) == (120, 120, 120)
