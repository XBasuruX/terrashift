# Map detail, soil and water inspection

## Choose the right detail

Open **Map detail & layers** on any Cesium map, including the isolated My Farm map.

- **Image source / archive:** compare current Esri imagery with public Wayback mosaics. Older imagery may be clearer locally. Dates are archive publication dates, not satellite acquisition dates; sharper coverage is not guaranteed.
- **Display quality:** Fast, Balanced and Fine change rendering quality and device-pixel sampling. Fine costs more GPU/network resources.
- **Basemap tile zoom cap:** levels 17, 19, 21 and 23 control requested tile levels, never source imagery detail.
- **1 / 5 / 20 m/px view:** change camera scale. Approximate ground view scale is displayed separately from source resolution.
- Each enabled reference layer has separate opacity and geometry detail: Overview, Balanced or Native source vertices. These change simplification, not survey accuracy.

The recent Sentinel layer starts disabled on the map so a 10 m product does not cover potentially sharper Esri context. No paid imagery API or Cesium ion token is required. Third-party service availability and terms apply.

## Soil and water

The [NSDI thematic library](https://nsdi.gov.lk/thematic-maps) links relevant sources. Actual geometry and attributes come from its public [Agriculture REST service](https://gisapps.nsdi.gov.lk/server/rest/services/Srilanka/Agriculture/MapServer).

Soil highlights enable classifications and conservation areas. Water highlights enable village tanks, lakes, rivers, reservoirs and irrigation schemes. Groundwater prospects, agro-ecological zones and land use can be enabled separately. Soil categories have attribute-based colors and legends; water uses blue. Click features for source attributes.

The API makes geometry valid, clips it to the viewport and optionally simplifies it. It requests at most 100 intersecting features per layer, discloses that limit, debounces camera movement and cancels obsolete requests. Views wider than 3 degrees must zoom closer. Opacity changes restyle existing geometry without refetching.

These are regional classifications with unverified update dates and accuracy. Soil classes are not soil tests or measured soil moisture. Mapped water does not establish current water levels. Reference classifications never silently replace farmer-entered model inputs.

## Recent satellite inspection

In **My Farm**, select a farm and **Fetch NSDI & latest Sentinel-2**. The public Earth Search STAC catalog supplies actual acquisitions. Choose manually, prefer the clearest of the latest 12 scenes, or prefer the latest. Cloud percentage describes the entire source tile, not just the farm.

| Product | Source or calculation | Native spectral support | Interpretation |
| --- | --- | --- | --- |
| True color | Original visual COG | 10 m | Dated visual context; clouds remain |
| NDWI | (green − NIR) / (green + NIR) | 10 m bands | Surface-water signal; no universal classification threshold |
| NDMI | (NIR − SWIR1) / (NIR + SWIR1) | 20 m SWIR1 | Vegetation/canopy moisture, not measured soil moisture |

Reflectance uses actual asset `raster:bands` scale, offset and nodata metadata. Inspected scenes include scale 0.0001 and offset −0.1; offsets matter in normalized differences. Missing scale/offset causes a visible failure rather than guessed constants. Zero denominators become missing. Scene Classification (SCL, 20 m) masks nodata, defective pixels, shadows, clouds, cirrus and snow. This basic quality screen and continuous index colors are not validated water or stress classifications or probabilities.

Choose 10 / 20 / 60 m sampling; NDMI enforces at least 20 m. Dimensions are capped at 1600 pixels per side, so large areas have coarser effective sampling, disclosed in the interface. Crops read bounded HTTP ranges from source COGs and reproject to WGS84. One scene is used, with no adjacent-scene mosaicking; outside-scene areas may be empty. Crop extents are limited to 1 degree per axis.

**Open detailed preview** opens a separate inspection window. Ground-window zoom and clicking request a smaller geographic crop from the original source. This recovers detail lost by the whole-area preview cap, without inventing subpixel detail. Crisp native pixels changes display interpolation. The main card is masked by the farm boundary; the detail window includes context.

There is no continuous high-resolution satellite video. Sentinel provides dated acquisitions; basemap resolution and dates vary. Drone/aerial survey uploads are not integrated.

## Code and contracts

### Render reliability

The flat globe loads intermediate terrain levels before descendants (`loadingDescendantLimit = 0`) and retains up to 512 terrain tiles. Fast uses screen-space error 4; Balanced/Fine retain the default 2, with Fine changing display pixel sampling. This reduces temporary fill-mesh churn without reducing the selected imagery tile cap. Intermediate levels can take longer to load.

Basemap switches add the replacement before removing the owned old layer. An unchanged URL/tile cap is reused, and arrival of the archive catalog no longer rebuilds the current basemap. These choices reduce unnecessary tile invalidation.

`src/lib/mapRuntime.ts` listens for actual Cesium render failures. For a missing terrain-edge mesh it tries one automatic reset of the flat terrain provider and resumes Cesium's stopped loop on the next task. It reports success only after a rendered frame. The camera, imagery, overlays and farm state stay in place. Repeated or unrelated failures remain visible with a **Restart map rendering** action; they cannot cause an infinite automatic restart loop. Diagnostics remain in console warnings. Listeners and timers are removed when the viewer is destroyed.

`tests/e2e/map-rendering.spec.ts` injects the reported TypeError inside a real render pass, verifies automatic recovery, checks repeated-failure/manual recovery, and stresses quality, zoom, archive and overlay switches. It reproduces the failure mode deterministically; it does not establish that every upstream Cesium terrain bug is eliminated.

- `src/components/MapLayers.tsx`: imagery archives, quality, vector lifecycle, legends and controls.
- `src/components/MapExplorer.tsx`: Cesium lifecycle, farm drawing, feature picking and isolated map.
- `src/components/FieldDetail.tsx`: scene/product selection and geographic detail windows.
- `backend/vector_maps.py`: `GET /api/land/imagery-options` and `GET /api/land/vectors/{layer}?bbox=w,s,e,n&detail=overview|balanced|native`.
- `backend/land.py`: scene discovery and `GET /api/land/sentinel/image?scene=…&bbox=…&sampling=10|20|60&product=truecolor|ndwi|ndmi`.
- `backend/spectral.py`: metadata-based reflectance, indices, quality masks and color ramps.
- `backend/range_reader.py`: bounded public-COG range reads.
- `backend/tests/test_map_detail.py`, `backend/tests/test_land.py`, `tests/e2e/map-detail.spec.ts`: geometry, arithmetic, raster and interaction checks.

Actual source fixtures: `backend/fixtures/nsdi_soil_geometry.json`, `nsdi_clipped_preview.json`, `wayback_config.json`, `sentinel_search.json`. Browser source mocks provide reproducibility. Separate live checks establish connectivity, not scientific validity. Indicators are not calibrated crop-model inputs.

## Sources

- [Esri Wayback custom basemaps](https://www.esri.com/arcgis-blog/products/arcgis-online/mapping/wayback-custom-basemap)
- [Esri imagery quality](https://support.esri.com/en-us/knowledge-base/why-does-the-world-imagery-basemap-quality-appear-to-ha-000017533)
- [Actual Earth Search collection metadata](https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a)
- [Copernicus Sentinel-2 instrument and band resolution](https://sentiwiki.copernicus.eu/web/s2-mission)
