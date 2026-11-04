"""Allowlisted Sri Lankan reference layers and free Sentinel-2 discovery/rendering."""

import asyncio, io, json, re
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, HTTPException, Response, Query
from pydantic import BaseModel, Field, model_validator
import math
from .contracts import Location

router = APIRouter(prefix="/api/land")
NSDI = "https://gisapps.nsdi.gov.lk/server/rest/services/Srilanka/Agriculture/MapServer"
STAC = "https://earth-search.aws.element84.com/v1"
LAYERS = {
    24: "Soil",
    34: "Agro ecological zones",
    21: "Land use",
    26: "Irrigation schemes",
    27: "Groundwater prospects",
}


class LandRequest(Location):
    boundary: list[list[float]] = Field(default_factory=list, max_length=200)

    @model_validator(mode="after")
    def valid_boundary(self):
        if self.boundary and (
            len(self.boundary) < 3
            or any(
                len(p) != 2
                or not all(math.isfinite(v) for v in p)
                or abs(p[0]) > 180
                or abs(p[1]) > 85
                for p in self.boundary
            )
        ):
            raise ValueError(
                "Boundary requires at least three finite WGS84 coordinate pairs."
            )
        return self


@router.get("/layers")
def layers():
    return {
        "service": NSDI,
        "reference": "https://nsdi.gov.lk/thematic-maps",
        "layers": [{"id": i, "name": n} for i, n in LAYERS.items()],
    }


@router.post("/context")
async def context(q: LandRequest):
    async with httpx.AsyncClient(timeout=18, follow_redirects=True) as client:

        async def layer(i, name):
            try:
                geometry = (
                    json.dumps(
                        {
                            "rings": [q.boundary + [q.boundary[0]]],
                            "spatialReference": {"wkid": 4326},
                        }
                    )
                    if len(q.boundary) >= 3
                    else f"{q.longitude},{q.latitude}"
                )
                p = dict(
                    f="json",
                    geometry=geometry,
                    geometryType="esriGeometryPolygon"
                    if len(q.boundary) >= 3
                    else "esriGeometryPoint",
                    inSR=4326,
                    spatialRel="esriSpatialRelIntersects",
                    outFields="*",
                    returnGeometry="false",
                    resultRecordCount=20,
                )
                r = await client.get(f"{NSDI}/{i}/query", params=p)
                r.raise_for_status()
                d = r.json()
                if "error" in d:
                    raise ValueError(str(d["error"]))
                fields = {v["name"]: v["alias"] for v in d.get("fields", [])}
                rows = [
                    {
                        fields.get(k, k): v
                        for k, v in f["attributes"].items()
                        if v is not None
                        and k
                        not in (
                            "objectid",
                            "st_area(shape)",
                            "st_length(shape)",
                            "perimeter",
                        )
                        and "area" not in k.lower()
                    }
                    for f in d.get("features", [])
                ]
                return dict(
                    id=i,
                    name=name,
                    status="live",
                    records=rows,
                    source=f"{NSDI}/{i}",
                    truncated=d.get("exceededTransferLimit", False),
                )
            except Exception as e:
                return dict(
                    id=i,
                    name=name,
                    status="unavailable",
                    records=[],
                    error=type(e).__name__,
                    source=f"{NSDI}/{i}",
                )

        results = await asyncio.gather(*(layer(i, n) for i, n in LAYERS.items()))
    return dict(
        layers=results,
        retrieved_at=datetime.now(timezone.utc).isoformat(),
        scope="Intersecting regional map units; not a soil test, area-weighted classification, weather measurement or verified update date.",
    )


@router.post("/sentinel")
async def sentinel(q: LandRequest):
    bbox = [
        q.longitude - 0.02,
        q.latitude - 0.02,
        q.longitude + 0.02,
        q.latitude + 0.02,
    ]
    if q.boundary:
        bbox = [
            min(v[0] for v in q.boundary),
            min(v[1] for v in q.boundary),
            max(v[0] for v in q.boundary),
            max(v[1] for v in q.boundary),
        ]
    try:
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.post(
                STAC + "/search",
                json={
                    "collections": ["sentinel-2-l2a"],
                    "bbox": bbox,
                    "limit": 12,
                    "sortby": [{"field": "properties.datetime", "direction": "desc"}],
                },
            )
            r.raise_for_status()
            d = r.json()
        return dict(
            scenes=[
                dict(
                    id=f["id"],
                    date=f["properties"]["datetime"],
                    cloud=f["properties"].get("eo:cloud_cover"),
                    visual=f["assets"]["visual"]["href"],
                    resolution=f["assets"]["visual"].get("gsd", 10),
                    thumbnail=f["assets"].get("thumbnail", {}).get("href"),
                    source=f"{STAC}/collections/sentinel-2-l2a/items/{f['id']}",
                )
                for f in d.get("features", [])
            ],
            bbox=bbox,
            note="Latest acquisitions, not live video. Cloud percentage is tile-wide. Rendered crops use the native 10 m visual asset; clouds remain visible.",
        )
    except (httpx.HTTPError, ValueError, KeyError) as e:
        raise HTTPException(
            503, detail="Sentinel catalog unavailable; Esri imagery remains available."
        ) from e


def render_image(asset, bbox, sampling=10):
    import rasterio
    import numpy as np
    from rasterio.warp import transform_bounds, reproject, Resampling
    from rasterio.transform import from_bounds
    from PIL import Image

    w, s, e, n = bbox
    if not (0 < e - w <= 1 and 0 < n - s <= 1):
        raise ValueError("Preview extent must be positive and no wider than 1 degree.")
    width = min(1600, max(16, int((e - w) * 111000 / sampling)))
    height = min(1600, max(16, int((n - s) * 111000 / sampling)))
    target = np.zeros((3, height, width), dtype=np.uint8)
    with rasterio.Env(
        GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
        CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
        GDAL_HTTP_TIMEOUT="25",
    ):
        from .range_reader import RangeReader

        with rasterio.open(
            "sentinel.tif" if asset.startswith("https://") else asset,
            opener=(lambda path, mode="rb": RangeReader(asset))
            if asset.startswith("https://")
            else None,
        ) as src:
            bounds = transform_bounds("EPSG:4326", src.crs, *bbox)
            window = src.window(*bounds)
            data = src.read(
                [1, 2, 3],
                window=window,
                boundless=True,
                fill_value=0,
                out_shape=(3, height, width),
                resampling=Resampling.bilinear,
            )
            from affine import Affine

            source_transform = src.window_transform(window) * Affine.scale(
                window.width / width, window.height / height
            )
            for band in range(3):
                reproject(
                    data[band],
                    target[band],
                    src_transform=source_transform,
                    src_crs=src.crs,
                    dst_transform=from_bounds(*bbox, width, height),
                    dst_crs="EPSG:4326",
                    resampling=Resampling.bilinear,
                )
    out = io.BytesIO()
    Image.fromarray(np.moveaxis(target, 0, 2)).save(out, format="PNG")
    return out.getvalue()


@router.get("/sentinel/image")
async def image(
    scene: str, bbox: str, sampling: int = Query(10), product: str = "truecolor"
):
    if sampling not in (10, 20, 60) or product not in ("truecolor", "ndwi", "ndmi"):
        raise HTTPException(422, detail="Unsupported sampling or image product.")
    if product == "ndmi":
        sampling = max(20, sampling)
    if not re.fullmatch(r"S2[ABC]_[A-Z0-9_]+_L2A", scene):
        raise HTTPException(422, detail="Invalid scene identifier.")
    try:
        bounds = [float(v) for v in bbox.split(",")]
        if len(bounds) != 4 or not all(-180 <= v <= 180 for v in bounds):
            raise ValueError()
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(f"{STAC}/collections/sentinel-2-l2a/items/{scene}")
            r.raise_for_status()
            item = r.json()
            asset = item["assets"]["visual"]["href"]
        if not asset.startswith("https://sentinel-cogs.s3.us-west-2.amazonaws.com/"):
            raise ValueError("Unexpected asset host.")
        from starlette.concurrency import run_in_threadpool

        if product == "truecolor":
            data = await run_in_threadpool(render_image, asset, bounds, sampling)
        else:
            from .spectral import render_indicator

            data = await run_in_threadpool(
                render_indicator, item, bounds, product, sampling
            )
        return Response(
            data,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except Exception as e:
        raise HTTPException(
            503,
            detail="Native Sentinel crop could not be rendered; use the original asset link or another scene.",
        ) from e
