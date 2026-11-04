# Six learning tracks

These tracks are interchangeable learning assignments, not permanent team roles. Pair across boundaries and rotate ownership after the first exercise. Everyone should first run the full application, finish the guided tour, enable Learning Mode, and read the difference between software correctness and scientific validity in [TESTING_GUIDE.md](TESTING_GUIDE.md).

## 1. Frontend architecture and design

**Concepts:** React state, context, client/server boundaries, typed props, controlled inputs, responsive hierarchy, accessible names and loading/error states.

**Files:** `src/app/layout.tsx`, `src/lib/store.tsx`, `src/components/Shell.tsx`, `UI.tsx`, `FarmConfig.tsx`, `src/app/globals.css`.

**Run:** both services, then `npm run dev`. Use the My Farm view and watch state flow into Rotation Studio.

**Exercise:** add a farmer-entered labor note, persist it, and show it in the decision brief. Label it contextual and do not invent a labor score.

**Verify:** reload the browser, confirm the note persists, change another input, inspect the generated brief, run TypeScript and the relevant end-to-end interaction. Explain why a new note field should not alter water balance.

## 2. Mapping and geospatial visualization

**Concepts:** WGS84 coordinate order, Web Mercator vs sinusoidal grids, map sources/layers, camera lifecycle, spatial support, point vs field and raster vs visual basemap.

**Files:** `MapExplorer.tsx`, `public/data/land.geojson`, `public/data/ATTRIBUTION.md`, `defaults.ts`.

**Run:** Earth Explorer with Layers open. Compare support grid, imagery and low graphics atlas.

**Exercise:** add an optional scale explanation showing the approximate kilometer dimensions of the POWER grid at the selected latitude. Use spherical geometry and disclose approximation. Do not imply a true field boundary.

**Verify:** compare equatorial and high-latitude dimensions; longitude width should contract with latitude. Check both hemispheres, map-click coordinates and remote-tile failure recovery. Explain why zooming cannot increase the scientific resolution.

## 3. NASA API integration

**Concepts:** HTTP requests, service documentation, JSON contracts, units, authentication, dataset versions, cache identity, missing values, quality flags and provenance.

**Files:** `backend/providers/power.py`, `service.py`, `modis.py`, genuine fixtures, `scripts/cache_power.py`, `scripts/research_nasa.py`, `NASA_DATA_GUIDE.md`.

**Run:** backend and `/docs`; request the exact default point in cached mode before trying live. Inspect the complete receipt and normalized SHA-256.

**Exercise:** add a new documented POWER variable. Read official documentation and capture a real response before modifying the parser. Add units and null semantics to the API and evidence view.

**Verify:** fixture-based parser test, wrong-unit rejection, missing-value case, and a live request if network permits. Confirm fallback never describes synthetic data as NASA observations. Explain why a CMR metadata record is not a science file.

## 4. Data processing and scientific calculations

**Concepts:** dimensional analysis, daily vs monthly aggregation, missingness, radiation geometry, ET₀, calibration, conservation and replay bias.

**Files:** `backend/science/climate.py`, `rotation.py` (season balance), `backend/tests/test_science.py`, `SCIENTIFIC_MODELS.md`.

**Run:** `.venv/Scripts/python.exe scripts/example.py`, then inspect `examples/result.json`.

**Exercise:** independently calculate one crop day’s ET₀ and bucket update with a spreadsheet or hand calculation. Then add a summary of maximum storage depletion with correct units.

**Verify:** compare the independent number, check `initial storage + inflow = final storage + overflow + supplied ET`, and test missing/zero rainfall. Explain the 0.408 radiation conversion and why modeled soil storage is not SMAP surface moisture.

## 5. Agricultural modeling and optimization

**Concepts:** crop families, local cultivars, legumes, hard vs soft constraints, MCDA, normalization, deterministic tie-breaking, Pareto dominance, sensitivity and robustness.

**Files:** `backend/knowledge.py`, `science/rotation.py`, `contracts.py`, `RotationStudio.tsx`, `Charts.tsx`.

**Run:** Rotation Studio, change priorities, inspect a card, edit the sequence, then open Climate Lab.

**Exercise:** add a configurable maximum number of consecutive family repeats as an optional farmer constraint. Keep the baseline visible even when it violates the constraint. Document why a family rule cannot represent all pest hosts.

**Verify:** a controlled sequence passes/fails at the intended boundary, feasible candidate counts change, and all-zero weights are rejected. Explain why the water-lean strategy may favor a low-diversity sequence and why it is not automatically a recommendation.

## 6. Testing, deployment, documentation and scientific validation

**Concepts:** test layers, representative fixtures, regression evidence, contracts, deployment boundaries, browser automation, dependency locking, error reports and source transparency.

**Files:** `backend/tests/`, `tests/e2e/`, `playwright.config.ts`, `README.md`, `KNOWN_LIMITATIONS.md`, `VALIDATION_REPORT.md`.

**Run:** backend tests, TypeScript, production build and complete browser tests. Inspect the generated PDF and mobile screenshot.

**Exercise:** introduce a controlled missing day in a copied fixture and demonstrate that rainfall totals and rotation modeling respond honestly. Repair only the test copy, not the genuine archived source. Write a short explanation of the different quality rules for charts and models.

**Verify:** the API emits the intended error, no chart shows -999 or a fabricated zero, the original fixture hash is unchanged, and the end-to-end journey still passes. Propose a field-validation plan with a local expert; do not claim the software suite validates farm outcomes.

## Shared review ritual

Each member traces one output from UI to endpoint to normalized data to equation and back. Bring one documented assumption, one failure case, one test and one unresolved scientific question. Exchange tracks and ask the next person to reproduce your result using only the repository documentation.
