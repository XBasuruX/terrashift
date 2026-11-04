# Verification record — 31 October 2026

## Cesium render-stop repair

The browser suite now has **9 passing journeys**, including a deterministic render-pass terrain error, successful loop recovery, bounded automatic retries, manual restart, and rapid quality/zoom/archive/overlay changes. The failure test failed against the previous implementation. Terrain refinement is more conservative, unchanged basemaps are reused, and replacements are added before the previous base is removed. A dedicated recovery handler resets the flat terrain provider and confirms a subsequent rendered frame. See `MAP_DETAIL_GUIDE.md`. The 49 backend tests are unaffected by this frontend repair.

## Map clarity and highlights upgrade

Current checks: **49 backend tests, 7 browser tests, TypeScript and production build passed**. New coverage verifies real-fixture NSDI clipping, detail contracts, Sentinel radiometric offset/nodata handling, index arithmetic, per-layer controls, legends, optional science overlays and detail-window geographic URL changes. Counts in historical sections below describe earlier releases.

Live checks returned clipped NSDI soil vectors, actual Wayback archive configuration, and rendered Sentinel NDWI/NDMI PNGs. A 0.32° × 0.23° true-color crop at 60 m sampling returned HTTP 200 and was visually inspected; part lay outside the source tile, illustrating the documented single-scene limitation. The live Cesium explorer was inspected with Fine quality, a 5 m/px view scale, and water/soil presets. These settings do not establish equivalent sensor resolution.

Actual source artifacts are `artifacts/ndwi-preview.png`, `artifacts/ndmi-preview.png` and `artifacts/large-field-preview.png`. Browser tests use explicit genuine-source fixtures for reproducibility. See `MAP_DETAIL_GUIDE.md` for implementation and scientific boundaries. No measured field soil moisture or validated water classification is claimed.

## Sri Lanka pilot upgrade

The current Cesium release passes 44 backend tests and the production build. Five browser journeys include drawing/saving a four-vertex field, isolated preview, independent irrigation settings across farms, and persistence after reload, alongside the original application journeys. Live NSDI queries were verified for five relevant reference layers. A recent free Sentinel-2 visual COG was cropped at native 10 m with bounded range reads and inspected as a real image. See `SRI_LANKA_PILOT.md`; the original renderer and single-farm descriptions below are historical.

This record distinguishes implemented and tested software from scientific validation. Tests ran on Windows with Node 22.22.2, bundled Python 3.12.14, Next.js 16.4.3, React 19, FastAPI and installed Chromium. Dependency versions are recorded in `package-lock.json` and `backend/requirements.lock.txt`.

| Check                                 | Result                                                             |
| ------------------------------------- | ------------------------------------------------------------------ |
| Backend scientific/provider/API tests | 41 passed                                                          |
| TypeScript                            | Passed                                                             |
| Next.js production build              | Passed                                                             |
| End-to-end browser suite              | 4 passed                                                           |
| Dependency installation audit         | 0 vulnerabilities reported                                         |
| Genuine POWER baseline                | 1,096 days, 2023–2025, Anuradhapura                                |
| Genuine MODIS subsets                 | 69 composites; 14 accepted, 55 rejected by the conservative screen |
| Reproducible calculation              | Generated `examples/result.json` successfully                      |
| Browser PDF                           | Generated through the complete decision-brief workflow             |

## Inspected behavior

The complete browser journey changed farm irrigation and priorities, recomputed three alternatives, edited a crop, carried the edited alternative into the brief, downloaded JSON, saved PDF, changed climate assumptions, selected an actual historical dry replay, inspected provenance, enabled Learning Mode and verified reload persistence. Other tests checked simulation fallback at an uncached location, tour navigation, a 390 px mobile layout and recovery from corrupt saved configuration.

The map was visually inspected in the in-app browser. A MapLibre v6 worker-path issue was identified and repaired by bundling the matching module worker during `postinstall`. The completed map renders actual Natural Earth geography and a static NASA GIBS Blue Marble regional backdrop, with source disclosure and the selected farm point. Dated MODIS true-color imagery may return empty images for an overpass/location; the static context layer does not pretend to be a recent acquisition.

## Default example

Using genuine cached weather and default inputs, the baseline index is about 67.54, the priority-led alternative about 99.26, and the water-lean alternative about 73.75. These indices are deterministic model outputs, not predicted yield, profitability or agricultural effectiveness. The water-lean candidate is repeated mung bean in this example, exposing the diversity trade-off and the need for local agronomic review.

## Verification limits

The PDF was rendered with Poppler and both A4 pages were visually checked. This review caught an object-key-order comparison that could discard a custom edited rotation. The comparison now uses stable serialization, and the browser test asserts that the selected edited crop survives into both the visible brief and exported JSON. The corrected two-page output was rendered and checked again.

The scientific model is uncalibrated locally. No crop trials, station bias assessment, scientific uncertainty propagation, expert agronomic approval or market validation was performed. SMAP/IMERG/ECOSTRESS/HLS science rasters were not ingested. Remote map imagery and live services can fail independently; the genuine cached default and explicit fallback modes keep the local learning journey usable.

A test-client dependency emits a deprecation warning about future HTTP client migration; current tests pass. The local Codex filesystem/socket sandbox required normal host execution for Next.js builds, server sockets and API tests. This environmental restriction and the initial NASA timeout did not cause simulated material to be labeled genuine.
