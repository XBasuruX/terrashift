# Backend guide

## Start

```powershell
.venv/Scripts/python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI instance is `backend.main:app`. Read `/docs` or `/openapi.json`. The backend has no login or billing integration. It binds to loopback by default. Do not expose a development server publicly as a production deployment.

## Follow one request

1. Pydantic validates the climate/farm/scenario request in `contracts.py`.
2. `providers/service.py` chooses a provider and obtains normalized `Observation` objects plus provenance.
3. `/api/climate` calls `science/climate.summarize`.
4. `/api/analyze` dispatches pure calculation to a thread pool, validates crop identifiers, creates a replay calendar and precomputes per-crop/per-slot outcomes.
5. Feasible combinations are enumerated; indices, weighted contributions, frontier, stress and sensitivity are returned.
6. `responses.py` validates the main weather/analysis response schemas, exposed in OpenAPI.

Errors in user input or insufficient model weather return HTTP 422 with `detail`. External POWER failure is contained in the provider and changes the active mode with a warning. A completely missing cache is not silently called NASA data.

## Source adapters

`power.py` is the only POWER response parser. It reads actual `properties.parameter`, `header` and `parameters` fields. It checks units, converts supported radiation units and retains nulls. Never add a parsing field based on a guessed JSON structure.

`simulation.py` is deterministic, coordinate/date dependent weather for software exploration. It has no empirical claim to reproduce a particular farm. It is never saved as a genuine observation cache.

`modis.py` serves an independent vegetation layer through public ORNL DAAC point subsets. It joins science/quality bands by date, screens raw values, and returns provider status and assumptions. A single-pixel contract avoids pretending a one-dimensional array is a field-average raster. Live requests are bounded below the service’s ten-composite limit. No synthetic NDVI is generated. Other satellite sources remain research-only.

## Pure computations

Functions in `science/` do not perform network I/O or read browser state. Call them directly in a Python REPL or `scripts/example.py`. Keep units explicit in variable names and returned keys. Add a new physical equation only after documenting required inputs, units, reference and calibration boundary. Numeric crop traits in `knowledge.py` are visible illustrative assumptions, not empirically validated local values.

The model reuses a precomputed crop/slot table for enumeration, so 8⁴ sequences do not each replay every day repeatedly. The frontier groups equal criterion triples. Stress tests are recalculated on only the three displayed sequences.

## Caching and operational limits

Runtime POWER responses are validated before atomic cache writes. The request URL hash includes source parameters, point and dates. Genuine fixtures can satisfy date subsets. No cache expiry, distributed locking, job queue or database is implemented. There is a two-request POWER concurrency semaphore, not a complete public-service rate limiter.

The application is local and single-team oriented. A public deployment needs quotas, structured logging, stable dependency review, server timeouts, cache revision policy, authentication and resource isolation. Do not add Earthdata credentials to frontend state or JSON exports.

## Debugging

- Check `/api/health` before debugging frontend requests.
- Call `/api/climate` for the exact displayed point and interval. Inspect `provenance.mode` and warning.
- If a rotation fails, inspect the HTTP 422 detail: crop duration/equipment/preferences may leave fewer than two alternatives, or the record may not cover all season days.
- Read `examples/result.json` to compare an API response with direct functions.
- For NASA changes, preserve a real response, confirm its metadata and update parser tests before updating the UI.

No arbitrary AI-generated explanations or scores enter this computation path.
