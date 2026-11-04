"""Viewport-clipped NSDI vectors; detail settings control simplification, not source accuracy."""

import json
import httpx
from fastapi import APIRouter, HTTPException, Query
from .land import NSDI

router = APIRouter(prefix="/api/land")


@router.get("/imagery-options")
async def imagery_options():
    from pathlib import Path

    mode = "live"
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            r = await c.get(
                "https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json"
            )
            r.raise_for_status()
            data = r.json()
    except (httpx.HTTPError, ValueError):
        data = json.loads(
            (Path(__file__).parent / "fixtures/wayback_config.json").read_text()
        )
        mode = "cached"
    values = list(data.items())
    selected = values[:24]
    years = set()
    for k, v in values[24:]:
        year = v["itemTitle"][-11:-7]
        if year not in years:
            selected.append((k, v))
            years.add(year)
    return {
        "mode": mode,
        "options": [
            {
                "id": k,
                "name": v["itemTitle"],
                "url": v["itemURL"]
                .replace("{level}", "{z}")
                .replace("{row}", "{y}")
                .replace("{col}", "{x}"),
            }
            for k, v in selected
        ],
        "note": "Archive release dates are not sensor acquisition dates. Older mosaics may be clearer, but source resolution and coverage vary.",
    }


VECTOR_LAYERS = {
    24: "Soil",
    34: "Agro-ecology",
    21: "Land use",
    26: "Irrigation",
    27: "Groundwater prospects",
    9: "Village tanks",
    14: "Lakes",
    17: "Rivers",
    18: "Reservoirs",
    25: "Soil conservation areas",
}


@router.get("/vectors/{layer}")
async def vectors(layer: int, bbox: str, detail: str = "balanced"):
    if layer not in VECTOR_LAYERS:
        raise HTTPException(404, detail="Unknown reference layer.")
    try:
        b = [float(x) for x in bbox.split(",")]
        if (
            len(b) != 4
            or not (-180 <= b[0] < b[2] <= 180 and -85 <= b[1] < b[3] <= 85)
            or b[2] - b[0] > 3
            or b[3] - b[1] > 3
        ):
            raise ValueError()
        tolerance = {"overview": 0.001, "balanced": 0.0001, "native": 0}[detail]
    except (ValueError, KeyError):
        raise HTTPException(
            422,
            detail="Zoom closer (maximum 3° extent); choose overview, balanced or native detail.",
        )
    params = dict(
        f="geojson",
        where="1=1",
        geometry=",".join(map(str, b)),
        geometryType="esriGeometryEnvelope",
        inSR=4326,
        outSR=4326,
        spatialRel="esriSpatialRelIntersects",
        outFields="*",
        returnGeometry="true",
        resultRecordCount=100,
        geometryPrecision=7,
    )
    if tolerance:
        params["maxAllowableOffset"] = tolerance
    try:
        async with httpx.AsyncClient(timeout=25, follow_redirects=True) as c:
            r = await c.get(f"{NSDI}/{layer}/query", params=params)
            r.raise_for_status()
            d = r.json()
        if d.get("type") != "FeatureCollection":
            raise ValueError("No feature collection returned.")
        from shapely.geometry import shape, mapping, box
        from shapely import make_valid

        output = []
        for f in d.get("features", []):
            if not f.get("geometry"):
                continue
            geom = make_valid(shape(f["geometry"])).intersection(box(*b))
            if tolerance:
                geom = geom.simplify(tolerance, preserve_topology=True)
            if geom.is_empty:
                continue
            props = f.get("properties", {})
            candidates = [
                "soil_type",
                "agro_eco_zone",
                "landuse",
                "land_use",
                "name",
                "NAME",
                "description",
                "type",
            ]
            label = next(
                (str(props[k]) for k in candidates if props.get(k)),
                VECTOR_LAYERS[layer],
            )
            output.append(
                dict(
                    type="Feature",
                    geometry=mapping(geom),
                    properties={
                        **props,
                        "__label": label,
                        "__layer": VECTOR_LAYERS[layer],
                    },
                )
            )
        return dict(
            type="FeatureCollection",
            features=output,
            metadata=dict(
                source=f"{NSDI}/{layer}",
                detail=detail,
                simplification_degrees=tolerance,
                source_resolution="Regional vector classification; spatial accuracy and update date unverified",
                truncated=len(d.get("features", [])) >= 100,
                bbox=b,
            ),
        )
    except (httpx.HTTPError, ValueError, KeyError) as e:
        raise HTTPException(
            503,
            detail="NSDI vector service unavailable. Other map layers remain usable.",
        ) from e
