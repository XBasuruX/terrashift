# TerraShift

**Map clarity upgrade:** per-map rendering/tile controls, free Esri Wayback alternatives, clipped NSDI soil/water vectors, Sentinel NDWI/NDMI and source-data detail windows are implemented. See [MAP_DETAIL_GUIDE.md](MAP_DETAIL_GUIDE.md) for controls, sources and scientific limits.

**Sri Lanka pilot upgrade:** CesiumJS, click-to-draw separate farm entities, isolated field previews, NSDI soil/agro-ecological/water overlays and live free Sentinel-2 scene discovery/native 10 m crops are implemented. See [SRI_LANKA_PILOT.md](SRI_LANKA_PILOT.md) for the current map and farm-library architecture; it supersedes earlier MapLibre/single-farm descriptions below.

**Understand Your Land. Explore Your Future.**

An implemented educational Earth-observation and crop-rotation reference for a six-person student team exploring [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/). This repository is an independent learning project, with no NASA endorsement. It is not presented as a competition submission or a validated agronomic decision system.

## Start locally

Requires Node.js 22+ and Python 3.12+. From the repository root:

```powershell
npm ci
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
```

Run the backend in one terminal:

```powershell
.venv/Scripts/python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Run the frontend in another:

```powershell
npm run dev
```

After setup, a single command can manage both processes:

```powershell
.venv/Scripts/python.exe scripts/dev.py
```

Ctrl+C stops only the child processes started by that launcher. `npm ci` also prepares the matching Cesium runtime under `public/vendor`, keeping workers and assets local.

Open [TerraShift](http://127.0.0.1:3000) and [interactive API documentation](http://127.0.0.1:8000/docs). On macOS/Linux use `.venv/bin/python` instead. `BACKEND_URL` in `.env.local` can change the proxy destination; restart Next.js after changing it.

On this development computer, the default Python 3.14 installation could not bootstrap a virtual environment. The checked local `.venv` was created using the bundled Python 3.12 runtime. If your system Python works, use the normal commands above. Generated environments and dependencies are ignored, not source-controlled.

## A complete learning journey

1. Start with the Anuradhapura sample, cached-first provider, and 2023–2025 interval. Genuine POWER responses are bundled for those coordinates and dates.
2. Explore the landscape. Search a town, open Map detail & layers, compare imagery and reference layers, then draw a farm boundary. Open My Farm for its isolated preview and recent Sentinel products.
3. Configure farmer-entered soil storage, irrigation, season, equipment, existing crops and candidate crops.
4. Open Rotation Studio. Compare the baseline, a weighted-priority alternative and a water-lean alternative. Inspect scores, edit seasons and change priority sliders.
5. Open Climate Lab. Replay the driest or wettest complete selected year or change temperature/rainfall assumptions.
6. Read Evidence & Sources. Inspect the observation receipt, missing values, crop assumptions and calculation flow.
7. Select a rotation and print a Decision Brief. Your browser can save it as PDF; JSON exports preserve the complete comparison.
8. Enable Learning Mode and follow the source modules through [TEAM_LEARNING_GUIDE.md](TEAM_LEARNING_GUIDE.md).

## Real data and offline behavior

- **NASA POWER:** functional live adapter, exact-location/date cache, real bundled 2023–2025 Anuradhapura observations. Daily air temperature, rainfall, radiation, humidity and wind. No API key.
- **Simulation:** deterministic synthetic weather with an explicit banner and source classification. Cached-first falls back to simulation only when no genuine matching cache exists. Live mode attempts POWER, then cache, then explicit simulation.
- **MODIS NDVI:** real public ORNL DAAC subset adapter, live/cached modes, and a genuine 69-composite 2023–2025 default-farm cache. Strict screening accepts 14 composites; rejected values are distinguished. No synthetic NDVI or crop-score inference is made.
- **Map:** CesiumJS, Esri current and Wayback basemaps, clipped NSDI vectors, geographic search, drawn boundaries and separate farms. Recent Sentinel true-color/NDWI/NDMI crops disclose dates and sampling. Imagery and indices are context, not calibrated crop-model inputs. Remote layers require network access.
- **Other satellite products:** research status and real catalog metadata captures are documented in [NASA_DATA_GUIDE.md](NASA_DATA_GUIDE.md). Metadata discovery is not equivalent to scientific raster ingestion.

The water model derives an uncalibrated Hargreaves ET₀ estimate and runs a daily bucket with visible assumptions. Rotation generation exhaustively enumerates the configured crop combinations, checks duration/equipment/preferences, applies normalized weights, computes a Pareto frontier, and stress-tests selected strategies. No generative AI makes scores or explanations.

No yield, profit, soil-carbon, nutrient-gain or erosion predictions are made. Soil health is represented only by explicit crop-diversity/family/legume hypotheses. Soil moisture and unconnected satellite indicators are withheld rather than fabricated. Read [SCIENTIFIC_MODELS.md](SCIENTIFIC_MODELS.md) and [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Verify and reproduce

```powershell
.venv/Scripts/python.exe -m pytest -q
.venv/Scripts/python.exe scripts/example.py
npm run typecheck
npm run build
```

With both servers running:

```powershell
npx playwright install chromium
npm run test:e2e
```

An installed Chromium may be supplied through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Browser tests cover the complete journey, scenario/weight changes, edits, persistence, explicit fallback, a guided tour, mobile layout and printable PDF generation. See [TESTING_GUIDE.md](TESTING_GUIDE.md) for details and validation boundaries.

The example writes [examples/result.json](examples/result.json), using 1,096 genuine daily records and the same scientific functions as the API. For another farm, explicitly populate the runtime cache:

```powershell
.venv/Scripts/python.exe scripts/cache_power.py --latitude 18.5204 --longitude 73.8567 --start 20230101 --end 20251231
```

## Repository guide

| Resource                                         | Purpose                                                       |
| ------------------------------------------------ | ------------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)               | Boundaries, state and design choices                          |
| [DATA_PIPELINE.md](DATA_PIPELINE.md)             | Requests, parsing, units, cache and provenance                |
| [NASA_DATA_GUIDE.md](NASA_DATA_GUIDE.md)         | Official sources, inspected responses and access requirements |
| [SCIENTIFIC_MODELS.md](SCIENTIFIC_MODELS.md)     | Equations, indices, assumptions and validity                  |
| [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)           | Components, mapping, charts and interaction                   |
| [BACKEND_GUIDE.md](BACKEND_GUIDE.md)             | FastAPI, providers and pure calculations                      |
| [API_CONTRACTS.md](API_CONTRACTS.md)             | Requests, responses, validation and errors                    |
| [TESTING_GUIDE.md](TESTING_GUIDE.md)             | Reproduction and meaningful verification                      |
| [TEAM_LEARNING_GUIDE.md](TEAM_LEARNING_GUIDE.md) | Six interchangeable practical learning tracks                 |
| [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)     | Incomplete capabilities and next validation work              |

Deployment is local. No accounts, hosted publication, billing, shared database or external sharing was configured. The architecture can be deployed later, but local browser persistence is not a production multi-user data store.
