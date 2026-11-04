# Data pipeline

## Weather request

Frontend state sends `{latitude, longitude, start, end, mode}` to `POST /api/climate`. Next.js proxies `/api/*` to FastAPI on port 8000. Dates are ISO calendar dates. The API rejects reversed intervals, future days, coordinates outside ±85° latitude/±180° longitude, and intervals longer than 1,826 days.

POWER uses `community=AG`, `format=JSON`, `time-standard=LST`, and date strings `YYYYMMDD`. Requested parameters are T2M, T2M_MIN, T2M_MAX, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M and WS2M. The complete request URL is retained in the receipt.

## Provider modes

1. **Live:** attempt a bounded NASA request. Validate parameters and units. Save only a genuine successfully validated response.
2. **Cached:** match the full URL cache key, or a bundled genuine fixture covering the interval at the requested point.
3. **Simulation:** generate synthetic daily weather deterministically from calendar date and coordinates. No simulation is written to a genuine observation cache.

Live failure proceeds to matching cache; missing cache proceeds to simulation with an explicit warning and active-mode change. Selecting simulation never attempts NASA. Missing observations within a genuine response remain null; simulation is not used to silently fill individual gaps.

The cache is local disk under `backend/cache` and excluded from source control. The fixtures under `backend/fixtures` are deliberate reproducible source inputs. Runtime cache has no expiry, so cached data is historical material, not a promise of current revisions.

## Actual response inspection

The bundled POWER responses contain:

```text
geometry.coordinates: [longitude, latitude, elevation]
header: title, api, sources, fill_value, time_standard, start, end
properties.parameter: parameter → YYYYMMDD → numeric value
parameters: parameter → units, longname
messages: service messages
```

The inspected 2024 record begins with T2M 25.19°C, rainfall 20.32 mm/day and shortwave radiation 9.59 MJ/m²/day on January 1. The AG response supplied radiation in **MJ/m²/day**; assuming kWh would have introduced a factor-of-3.6 error. The parser checks the actual metadata. Supported kWh alternatives are converted with `1 kWh = 3.6 MJ`.

Canonical normalized units are °C, mm/day, MJ/m²/day, percent and m/s. Sentinel `header.fill_value` (observed -999) and absent keys become null. Every calendar day between response start and end is retained, including February 29 and fully absent observation dates.

## Derived climate data

Monthly temperature is the valid daily mean and is withheld when fewer than 80% of requested days in that month have valid temperatures. Monthly rainfall and ET₀ sums require every day of a complete calendar month. Coverage includes expected calendar days, so a four-day February slice cannot look like complete monthly data.

Total interval rainfall is withheld if any day is missing. Missing rain breaks the dry-spell run; it does not imply zero rainfall. Heat/frost counts are based on available maximum/minimum observations. Same-month temperature departures require at least three values in the selected interval and are explicitly not long-term climatological anomalies.

## Model path

`POST /api/analyze` uses the same provider and receives farm/scenario inputs. Day-of-year weather is replayed as a month-day mean across selected years, or from the driest/wettest complete selected year. Crop evaluation requires complete weather for each modeled growing window; otherwise the API returns a scientific-data sufficiency error instead of estimating missing temperatures.

The water and temperature model receives no map colors, arbitrary NDVI score, predicted yield or generated AI output. Soil storage and irrigation are farmer inputs. See [SCIENTIFIC_MODELS.md](SCIENTIFIC_MODELS.md) for equations.

## Receipts and exports

Receipts record requested/active mode, source classification, point, observation interval, daily time standard, nominal support, request URL, retrieval timestamp or fixture identity, null-value count and normalized SHA-256. JSON comparison exports preserve farm, weights, scenario, individual-season calculations, frontier and assumptions. The printed brief uses the computed farm snapshot, avoiding a mismatch with unsent form values.

## Quality boundary

POWER quality metadata is limited to supplied service metadata, null checks and unit validation; this application does not claim field calibration or comprehensive meteorological quality control. Scientific raster products require their own QA masks, scale factors and coordinate systems. A CMR metadata record proves discovery only. It does not prove a valid measurement at the selected farm.
