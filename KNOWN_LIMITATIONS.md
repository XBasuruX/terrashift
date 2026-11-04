# Known limitations and unfinished work

For current detail controls, clipped NSDI vectors, Esri archives and Sentinel NDWI/NDMI, see [MAP_DETAIL_GUIDE.md](MAP_DETAIL_GUIDE.md). Tile/display settings cannot increase sensor resolution. NDMI represents vegetation moisture, not measured soil moisture. Satellite detail uses one scene; scene-edge gaps can occur. Preview dimensions are capped; zooming requests smaller source windows. No validated water classifier, drone-upload workflow or live satellite video is implemented.

**Updated Sri Lanka pilot:** Cesium now replaces MapLibre. Polygon drawing, separate persistent farm entities/categories, isolated previews, NSDI map overlays/intersection attributes, and a native 10 m Sentinel-2 crop route are implemented. The earlier map/single-farm limitations below are superseded by [SRI_LANKA_PILOT.md](SRI_LANKA_PILOT.md). NSDI regional map update dates remain unverified; coarse weather is still not field-level weather. Sentinel imagery is periodic and cloud limited, not a live video feed.

## Implemented journey

Seven connected workspace views support geographic exploration, farmer configuration, environmental charts, three computed rotations, priority weights, edited alternatives, historical/custom scenarios, Pareto/stress/sensitivity views, an evidence interface, a guided tour, Learning Mode, JSON exports and a printable decision brief. POWER live/cache/simulation and MODIS public-subset live/cache are real implementations. The default POWER record is genuine 2023–2025 Anuradhapura data.

## Scientific limits

- No local crop calibration, agronomic validation or field trials have been performed.
- Crop numeric traits are explicit educational assumptions. Family/legume rules are proxies, not nutrient or pest models.
- Hargreaves ET₀ is uncalibrated. Full FAO Penman–Monteith is not implemented.
- Constant Kc, independent seasonal storage resets, uniform irrigation and simple overflow discard omit important hydrology. Rice ponding/seepage is omitted, making rice comparisons incomplete.
- Annual dry/wet selection is not necessarily the driest/wettest crop season. Mean month-day weather smooths extremes. A three-year sample is not a climate normal.
- Temperature shifts and rainfall multipliers are hypothetical, not forecasts. Fixed stress tests and sensitivity curves are not statistical confidence intervals.
- Root traits and soil texture are contextual. Farmer-entered available storage drives the model. Soil moisture is not measured.
- No yield, profit, soil-carbon, erosion, precise nutrient gain, economic optimization or long-term soil-health predictions are supplied.
- Suitability uses daily mean temperature; heat/frost flags are separate. Local cultivars, day length, growing degree requirements, terrain, waterlogging and crop-specific extremes remain to be modeled with evidence.
- Market notes, equipment detail and economics need much richer locally sourced constraints.

## Data limits

- POWER is coarse reanalysis/derived data, not a field sensor. No downscaling or field-level accuracy is claimed.
- Runtime cache has no expiry/revision refresh policy. The bundled source responses are historical snapshots.
- SMAP, IMERG, ECOSTRESS and HLS raster science adapters remain unfinished. Real CMR metadata was inspected; protected science files, QA masks, fill attributes and geospatial extraction were not verified. They are marked research-only in the application.
- SMAP v005 discovery returned no granules in the tested query; collection migration/version selection remains unresolved.
- MODIS NDVI is a single mixed-land-cover pixel, quality screened; it cannot identify crop type or yield. ORNL subset responses do not expose collection version, so the service’s collection mapping requires independent confirmation before scientific research use.
- MODIS rejected values remain visible only as a labeled unscreened context line. They are withheld from the accepted series and never enter crop scoring.
- Genuine caches cover the default location and interval. Other locations need live downloads; missing weather cache becomes explicit synthetic weather. No synthetic NDVI is produced.
- Sensor error propagation, validated bias correction, local station comparison and scientifically estimated uncertainty distributions are unfinished.

## Geographic and visualization limits

- MapLibre supplies a globe-to-farm camera transition, not a photorealistic 3D globe. No Cesium/Three.js terrain model is included.
- Area selection is a point plus farmer-entered hectares. Polygon drawing, cadastral boundaries and multi-field zoning are unfinished.
- The support grid is an approximate visualization of nominal POWER scale, not a verified interpolation stencil.
- Esri/GIBS imagery requires network access and may be unavailable or cloudy. Acquisition dates vary for Esri; GIBS uses the selected end date. Imagery is not processed into measurements.
- No scientific geographic heatmap is invented from a single point. The implemented quantitative heatmap is month × year temperature. Regional gridded scientific overlays remain future work.

## Application and operations

- Local browser storage persists farm inputs and Learning Mode. There are no accounts, server database, collaboration synchronization, workspace permissions or production audit logs.
- Navigation is view state; URL deep links/back-button view history are not implemented.
- Edited alternatives are session-local and regenerate when analysis assumptions change. Export JSON to retain a particular comparison.
- PDF export uses the browser’s print/PDF engine; no independent backend document service is included.
- No production hosting was configured. Docker/remote deployment, rate limiting, job cancellation, credential management and load testing need deployment-specific work.
- Accessibility includes labels, focus visibility, responsive controls and reduced-motion support, but a full keyboard/screen-reader audit remains unfinished.

These are explicit next engineering and scientific-validation tasks. The application’s working software should be used to inspect and challenge them, not to conceal them.
