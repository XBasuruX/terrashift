import asyncio
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import httpx
from ..contracts import ClimateQuery
from .power import FIELDS, parse_power, validate_power
from .simulation import simulate

BASE = Path(__file__).resolve().parents[1]
CACHE = BASE / "cache"
LOCK = asyncio.Semaphore(2)


def matching_fixture(query):
    for path in (BASE / "fixtures").glob("power_*.json"):
        try:
            p = json.loads(path.read_text())
            lon, lat = p["geometry"]["coordinates"][:2]
            if (
                abs(lat - query.latitude) < 0.001
                and abs(lon - query.longitude) < 0.001
                and str(p["header"]["start"]) <= query.start.strftime("%Y%m%d")
                and str(p["header"]["end"]) >= query.end.strftime("%Y%m%d")
            ):
                return p, str(path.name)
        except (ValueError, KeyError, TypeError):
            continue
    return None


async def get_climate(query: ClimateQuery):
    args = dict(
        parameters=",".join(FIELDS),
        community="AG",
        longitude=query.longitude,
        latitude=query.latitude,
        start=query.start.strftime("%Y%m%d"),
        end=query.end.strftime("%Y%m%d"),
        format="JSON",
        **{"time-standard": "LST"},
    )
    url = str(
        httpx.URL("https://power.larc.nasa.gov/api/temporal/daily/point", params=args)
    )
    cache_key = hashlib.sha256(url.encode()).hexdigest()
    path = CACHE / f"{cache_key}.json"
    payload = None
    mode = query.mode
    warning = None
    receipt = None
    if mode == "live":
        try:
            async with LOCK:
                async with httpx.AsyncClient(
                    timeout=45, follow_redirects=True
                ) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    payload = response.json()
            validate_power(payload)
            CACHE.mkdir(exist_ok=True)
            receipt = datetime.now(timezone.utc).isoformat()
            temp = path.with_suffix(".tmp")
            temp.write_text(json.dumps({"payload": payload, "retrieved_at": receipt}))
            temp.replace(path)
        except (httpx.HTTPError, ValueError, KeyError, OSError) as error:
            warning = f"Live POWER unavailable ({type(error).__name__}); checking genuine cache."
            mode = "cached"
            payload = None
    if mode == "cached":
        try:
            if path.exists():
                cached = json.loads(path.read_text())
                payload, receipt = cached["payload"], cached["retrieved_at"]
            else:
                fixture = matching_fixture(query)
                if fixture:
                    payload, receipt = fixture
            if payload:
                validate_power(payload)
        except (ValueError, KeyError, OSError):
            payload = None
        if not payload:
            mode = "simulation"
            warning = (
                (warning + " " if warning else "")
                + "No genuine cache matches these coordinates and dates. Explicit simulation fallback is active."
            )
    records = (
        simulate(query)
        if mode == "simulation"
        else [r for r in parse_power(payload) if query.start <= r.date <= query.end]
    )
    if not records:
        raise ValueError("No records in requested interval.")
    digest = hashlib.sha256(
        json.dumps(
            [r.model_dump(mode="json") for r in records], sort_keys=True
        ).encode()
    ).hexdigest()
    return records, dict(
        requested_mode=query.mode,
        mode=mode,
        source="Deterministic synthetic weather"
        if mode == "simulation"
        else "NASA POWER / MERRA-2",
        classification="simulated" if mode == "simulation" else "gridded estimate",
        latitude=query.latitude,
        longitude=query.longitude,
        start=str(query.start),
        end=str(query.end),
        time_standard="LST",
        resolution="No observational resolution (synthetic)"
        if mode == "simulation"
        else "Meteorology 0.5° × 0.625°; solar ~1°",
        request_url=url,
        retrieved_at=receipt,
        sha256=digest,
        warning=warning,
        missing_values=sum(
            v is None for r in records for k, v in r.model_dump().items() if k != "date"
        ),
    )
