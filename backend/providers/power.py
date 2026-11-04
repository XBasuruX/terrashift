import math
from datetime import datetime, timedelta
from ..contracts import Observation

FIELDS = {
    "T2M": "temperature",
    "T2M_MIN": "minimum",
    "T2M_MAX": "maximum",
    "PRECTOTCORR": "precipitation",
    "ALLSKY_SFC_SW_DWN": "solar",
    "RH2M": "humidity",
    "WS2M": "wind",
}


def parse_power(payload: dict) -> list[Observation]:
    """Parse documented POWER GeoJSON, keeping absent dates and sentinel values null."""
    parameters = payload["properties"]["parameter"]
    fill = payload.get("header", {}).get("fill_value", -999)
    start = datetime.strptime(str(payload["header"]["start"]), "%Y%m%d").date()
    end = datetime.strptime(str(payload["header"]["end"]), "%Y%m%d").date()
    records = []
    for offset in range((end - start).days + 1):
        day = start + timedelta(days=offset)
        key = day.strftime("%Y%m%d")
        values = {}
        for code, field in FIELDS.items():
            value = parameters.get(code, {}).get(key)
            if value is None or value == fill or not math.isfinite(float(value)):
                values[field] = None
            else:
                values[field] = float(value)
                if field == "solar" and payload.get("parameters", {}).get(code, {}).get(
                    "units"
                ) in {"kW-hr/m^2/day", "kWh/m^2/day"}:
                    values[field] *= 3.6  # Canonical shortwave radiation is MJ/m²/day.
        records.append(Observation(date=day, **values))
    return records


def validate_power(payload: dict):
    # Reject unexpected units rather than silently applying the wrong conversions.
    for code, accepted in {
        "T2M": {"C"},
        "T2M_MIN": {"C"},
        "T2M_MAX": {"C"},
        "PRECTOTCORR": {"mm/day"},
        "ALLSKY_SFC_SW_DWN": {"MJ/m^2/day", "kW-hr/m^2/day", "kWh/m^2/day"},
    }.items():
        actual = payload.get("parameters", {}).get(code, {}).get("units")
        if actual not in accepted:
            raise ValueError(f"Unexpected or absent POWER units for {code}: {actual}")
    if not payload.get("properties", {}).get("parameter", {}).get("T2M"):
        raise ValueError("POWER returned no temperature series.")
