# Testing and validation

## Four distinct questions

1. **Software correctness:** are contracts, persistence, null handling and UI interactions implemented correctly?
2. **Mathematical correctness:** are units, equations, bounds, mass balance and weighting internally consistent?
3. **Scientific validity:** do the selected inputs and model represent the local system adequately? This remains unvalidated.
4. **Agricultural effectiveness:** do choices improve outcomes in real farms? This requires local review and field evidence; the application does not establish it.

Do not treat a passing suite or polished chart as proof of questions 3 or 4.

## Backend

```powershell
.venv/Scripts/python.exe -m pytest -q
```

Tests use genuine archived NASA/ORNL responses and deterministic synthetic weather. Network is not required. `test_science.py` checks real POWER parsing, radiation units, sentinel/null handling, absent whole dates, leap years, geographic/date bounds, synthetic reproducibility, partial-month withholding, missing-day dry spells, the independent FAO radiation example, ET₀ conversion, priority normalization, water bounds/stress direction, missing replay rejection, constraints, custom sequences, irrigation-volume conversion, family changes, historical year selection, Pareto dominance and location-safe fallback.

`test_api.py` exercises health, catalog/OpenAPI, climate and analysis contracts, altered scenarios, structured validation failures, incomplete windows and a mocked live outage that must fall back to genuine cache.

`test_modis.py` uses the actual all-band ORNL response and explicit QA cases. It checks scaled values, conservative rejection, fill/shadow masking, duplicate-date handling and the refusal to generate simulated NDVI. Quality masks are software checks, not a locally validated stress classification.

## Frontend and build

```powershell
npm run typecheck
npm run build
```

TypeScript validates frontend contracts and component usage. The production build also checks server/client imports. MapLibre is client-only and loaded dynamically. In the Codex restricted Windows sandbox, SWC could not canonicalize the OneDrive path; the identical build passed when permitted to run with normal workspace access. This is an execution-environment limit, not an application fallback.

## End-to-end browser tests

Start both services, then:

```powershell
npx playwright install chromium
npm run test:e2e
```

To reuse an installed browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its absolute executable path. The test config reads this optional variable; no machine-specific browser path is committed. Tests do not use real farmer personal data.

The complete journey covers:

- genuine cached NASA startup;
- farm name/irrigation edits and browser persistence;
- three computed rotation cards;
- priority changes that alter the index;
- readable score decomposition;
- editing an alternative through the same backend and carrying it into the brief;
- JSON export and browser PDF creation;
- climate perturbations that change results;
- historical dry-year replay;
- provenance and Learning Mode;
- explicit simulation fallback at a non-cached sample location;
- tour navigation;
- a 390 px mobile form with no horizontal overflow.

`test-results/` and `playwright-report/` are generated and ignored. Failed tests retain a screenshot and trace. The PDF can be opened independently to check pagination. A current verification record is in [VALIDATION_REPORT.md](VALIDATION_REPORT.md).

## Reproducible example

```powershell
.venv/Scripts/python.exe scripts/example.py
```

This uses genuine 2023–2025 POWER observations, runs the same pure model as the API and writes `examples/result.json`. It is the smallest path from source data to inspectable alternatives. Check the receipt mode before comparing outputs. Different raw revisions or crop assumptions can legitimately change the checksum or result.

## Manual checks worth doing

Open every view at desktop and narrow widths; verify map tile failure can recover to the offline atlas. Change coordinates, interval, provider and priorities. Test a partial date window: climate charts should work but rotation modeling should explain insufficient daily coverage. Set equipment to standard and confirm generated rice options disappear. Reduce the growing window until fewer than two alternatives are feasible and confirm a clear error.

For scientific validation, compare POWER with local stations, test ET₀ against a vetted implementation and local meteorology, calibrate crop coefficients/calendar/storage, compare modeled water balance with observations, and involve a local agronomist in pest, soil and market constraints. Maintain these as a separate validation program rather than changing test tolerances until a desired score appears.
