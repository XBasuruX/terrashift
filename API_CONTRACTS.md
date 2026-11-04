# API contracts

Base URL: `http://127.0.0.1:8000`. Frontend requests `/api/*` through the same-origin Next.js proxy. Pydantic request types are in `backend/contracts.py`; climate and analysis response models are in `backend/responses.py`; TypeScript consumers are in `src/lib/types.ts`.

## Health and catalog

`GET /api/health` → `{status: "ok", model_version: "1.0.0"}`.

`GET /api/catalog` → `{crops: Record<string, Crop>, sources: Source[]}`. Crop metadata include names, families, illustrative traits and display color. Source status distinguishes implemented routes from research-only integrations.

## Climate

`POST /api/climate`:

```json
{
  "latitude": 8.3114,
  "longitude": 80.4037,
  "start": "2023-01-01",
  "end": "2025-12-31",
  "mode": "cached"
}
```

Response:

```text
daily[]: date, temperature, minimum, maximum, precipitation, solar, humidity, wind
monthly[]: month, temperature, precipitation, eto, coverage, valid_days, expected_days
summary: temperature, precipitation, heat_days, frost_days, longest_dry_spell, coverage
anomalies[]: month, departure
anomaly_note: selected-interval baseline explanation
provenance: requested_mode, mode, source, classification, latitude, longitude,
            start, end, time_standard, resolution, request_url,
            retrieved_at, sha256, warning, missing_values
```

Daily temperature units are °C; precipitation mm/day; solar MJ/m²/day; humidity %; wind m/s. Monthly rain and ET₀ are mm. Missing values use JSON null, never -999 or NaN. Completeness is a fraction. A response can be successful while the provider changes from requested live/cached to explicit simulation.

## Analysis

`POST /api/analyze`:

```json
{
  "farm": {
    "name": "Anuradhapura learning farm",
    "latitude": 8.3114,
    "longitude": 80.4037,
    "area_ha": 12,
    "soil": "loam",
    "available_water_mm": 120,
    "irrigation_mm": 80,
    "season_start_month": 10,
    "season_length_days": 120,
    "previous_crop": "rice",
    "existing": ["rice", "rice", "maize", "rice"],
    "allowed_crops": ["rice", "maize", "mungbean", "cowpea", "sorghum", "groundnut"],
    "equipment": "paddy",
    "market_note": "Confirm local buyers.",
    "priorities": { "water": 40, "diversity": 35, "suitability": 25 }
  },
  "climate": {
    "latitude": 8.3114,
    "longitude": 80.4037,
    "start": "2023-01-01",
    "end": "2025-12-31",
    "mode": "cached"
  },
  "scenario": { "kind": "typical", "temperature_delta": 0, "rainfall_factor": 1 }
}
```

`alternatives` is optional: exactly two arrays, each exactly four valid crop identifiers. Supplied sequences are evaluated and may return feasibility flags; they are not silently replaced with generated sequences. The baseline always remains the farm’s existing rotation.

`rotations` contains baseline and two alternatives. Each has sequence, score, metrics, contributions, feasible, pareto, demand/deficit depths, irrigation-volume conversion, legume count, family-break count, season-level balance/flags/trace, stress tests, worst fixed stress-test score and temperature sensitivity.

The response also includes normalized weights, feasible candidate count (excluding baseline), frontier samples/count, selected replay year if applicable, scenario, model label, assumptions, source receipt and the exact farm snapshot used. Identifiers `existing`, `balanced` and `diverse` are stable UI identifiers; the third strategy is now displayed as water-lean. The identifier is not itself an agronomic classification.

## Vegetation

`POST /api/vegetation` accepts the same `ClimateQuery`. It is independent of weather/scoring.

```text
records[]: date, ndvi, raw_ndvi, pixel_reliability, vi_quality, accepted
mode: live | cached | unavailable
source, resolution, temporal, units, accepted, rejected,
retrieved_at, requests[], quality_rule, note, warning
```

Successful unavailable responses contain an empty `records` array and an explanation. Simulation never fabricates vegetation. Dates are composite-start dates. NDVI is dimensionless; accepted NDVI is null when quality screening fails. Unscreened valid-range values are retained for a distinctly labeled learning line. The service does not declare collection version in the subset payload; that limitation is retained.

## Validation and errors

- Latitude ±85°, longitude ±180°; finite values only.
- Historical dates from 1981 through yesterday, ordered, interval ≤1,826 days.
- Farm and climate coordinates must match.
- Four baseline seasons; 1–8 candidate crops; crop IDs must exist.
- Positive area; finite bounded water, duration and priority inputs.
- At least one positive priority.
- Scenario kind typical/dry/wet/custom; temperature shift −5…8°C; rainfall multiplier 0.2…2.

Pydantic errors return HTTP 422 with an array of location/message details. Model sufficiency errors return HTTP 422 with a readable string. Example: historical dry replay with only one complete year; a partial interval that cannot cover crop days; too few feasible alternatives. HTTP 200 is not a guarantee of observed data or scientific validity—always inspect provider and classification.
