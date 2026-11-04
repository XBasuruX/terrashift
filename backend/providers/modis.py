"""ORNL DAAC MOD13Q1 point subsets, independent of weather and crop scoring."""

import hashlib
import json
from datetime import date, timedelta, datetime, timezone
import httpx
from ..contracts import ClimateQuery
from .service import BASE, CACHE

NDVI = "250m_16_days_NDVI"
RELIABILITY = "250m_16_days_pixel_reliability"
QUALITY = "250m_16_days_VI_Quality"
URL = "https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset"


def parse_modis(batches):
    by_date = {}
    for payload in batches:
        if payload["nrows"] != 1 or payload["ncols"] != 1:
            raise ValueError("This adapter requires a single-pixel subset.")
        for item in payload["subset"]:
            if item["band"] not in (NDVI, RELIABILITY, QUALITY):
                continue
            value = item["data"][0] if len(item["data"]) == 1 else None
            by_date.setdefault(item["calendar_date"], {})[item["band"]] = value
    records = []
    for day, bands in sorted(by_date.items()):
        raw = bands.get(NDVI)
        reliability = bands.get(RELIABILITY)
        qa = bands.get(QUALITY)
        valid_range = raw is not None and -2000 <= raw <= 10000
        # MODLAND bits 0-1 good; usefulness 0..2; no adjacent/mixed cloud, snow or shadow.
        good_qa = (
            qa is not None
            and qa != 65535
            and (int(qa) & 3) == 0
            and ((int(qa) >> 2) & 15) <= 2
            and (int(qa) & ((1 << 8) | (1 << 10) | (1 << 14) | (1 << 15))) == 0
        )
        accepted = valid_range and reliability == 0 and good_qa
        records.append(
            dict(
                date=day,
                ndvi=round(raw * 0.0001, 4) if accepted else None,
                raw_ndvi=round(raw * 0.0001, 4) if valid_range else None,
                pixel_reliability=reliability,
                vi_quality=qa,
                accepted=accepted,
            )
        )
    return records


async def get_vegetation(query: ClimateQuery):
    mode = query.mode
    warning = None
    payload = None
    key = hashlib.sha256(
        f"MOD13Q1:{query.latitude}:{query.longitude}:{query.start}:{query.end}".encode()
    ).hexdigest()
    path = CACHE / f"modis_{key}.json"
    if mode == "simulation":
        return dict(
            records=[],
            mode="unavailable",
            warning="No synthetic NDVI is generated. Vegetation requires genuine MODIS data.",
            source="MOD13Q1 / ORNL DAAC",
        )
    if mode == "live":
        try:
            batches = []
            requests = []
            async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:
                start = query.start
                # At most 8 16-day composites per bounded request, below service cap 10.
                while start <= query.end:
                    end = min(query.end, start + timedelta(days=119))
                    params = dict(
                        latitude=query.latitude,
                        longitude=query.longitude,
                        startDate=start.strftime("A%Y%j"),
                        endDate=end.strftime("A%Y%j"),
                        kmAboveBelow=0,
                        kmLeftRight=0,
                    )
                    r = await client.get(
                        URL, params=params, headers={"Accept": "application/json"}
                    )
                    r.raise_for_status()
                    batches.append(r.json())
                    requests.append(str(r.url))
                    start = end + timedelta(days=1)
            parse_modis(batches)
            payload = dict(
                latitude=query.latitude,
                longitude=query.longitude,
                start=str(query.start),
                end=str(query.end),
                retrieved_at=datetime.now(timezone.utc).isoformat(),
                requests=requests,
                batches=batches,
            )
            CACHE.mkdir(exist_ok=True)
            path.write_text(json.dumps(payload))
        except (httpx.HTTPError, ValueError, KeyError, OSError):
            mode = "cached"
            warning = "Live vegetation access failed. Checking genuine cache."
    if mode == "cached":
        paths = [path] + list((BASE / "fixtures").glob("modis_*_2023_2025.json"))
        for candidate in paths:
            try:
                p = json.loads(candidate.read_text())
                if (
                    abs(p["latitude"] - query.latitude) < 0.000001
                    and abs(p["longitude"] - query.longitude) < 0.000001
                    and p["start"] <= str(query.start)
                    and p["end"] >= str(query.end)
                ):
                    payload = p
                    break
            except (OSError, ValueError, KeyError):
                continue
    if payload is None:
        return dict(
            records=[],
            mode="unavailable",
            warning=warning
            or "No genuine MODIS subset cache covers this location and interval. Live mode can request it.",
            source="MOD13Q1 / ORNL DAAC",
        )
    records = [
        r
        for r in parse_modis(payload["batches"])
        if str(query.start) <= r["date"] <= str(query.end)
    ]
    return dict(
        records=records,
        mode=mode,
        source="NASA MODIS MOD13Q1 via ORNL DAAC",
        product="MOD13Q1; service collection version must be verified for each acquisition",
        classification="QA-screened satellite vegetation index",
        resolution="Nominal 250 m; sinusoidal cell ~231.66 m",
        temporal="16-day composite; date is composite start",
        units="NDVI, dimensionless",
        accepted=sum(r["accepted"] for r in records),
        rejected=sum(not r["accepted"] for r in records),
        retrieved_at=payload["retrieved_at"],
        requests=payload["requests"],
        warning=warning,
        quality_rule="Pixel reliability = 0; MODLAND QA = 0; usefulness ≤ 2; adjacent/mixed cloud, snow and shadow bits clear. Fill and invalid ranges excluded.",
        note="Single pixel may mix crops, roads, trees and other land cover. Not crop identification, yield, soil nutrients or a model input.",
    )
