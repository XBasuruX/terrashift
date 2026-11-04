# Sri Lanka pilot: Cesium, independent farms and live reference data

The map engine is now **CesiumJS**, using locally bundled runtime/workers and an ellipsoid globe without an ion token. Esri World Imagery remains the visual basemap; its detail and acquisition date vary. It is not claimed to be current 10 m imagery.

## Draw and inspect a farm

1. Open Earth Explorer or Overview and find a Sri Lankan town.
2. Select **Draw a new farm**. Click vertices around the perimeter; undo a point if necessary. Save after at least three points.
3. My Farm opens the new entity with its own name, category, estimated geodesic area, crops, soil assumptions, irrigation and priority weights.
4. The selected polygon is shown in a separate Cesium preview. Globe polygon clipping isolates the field where GPU support permits it. The boundary can be redrawn using Edit boundary.
5. The farm library groups entities by editable category. Switching entities restores their separate configurations; the library persists in this browser under `terrashift-farms-v2`. Legacy single-farm state is migrated. Derived climate/model results are recomputed for the selected entity, not shared as if every field has identical conditions.

Boundary points are user-drawn, not cadastral survey measurements. Crossed polygon edges are rejected. Nearby farms may still share the same coarse NASA POWER grid; separating entities cannot create finer observations.

## NSDI reference library

The requested source https://nsdi.gov.lk/thematic-maps links static soil and agro-ecological maps. We investigated its corresponding public queryable service:

https://gisapps.nsdi.gov.lk/server/rest/services/Srilanka/Agriculture/MapServer

Actual JSON metadata and a point query are archived under `backend/fixtures/nsdi_*`. The implemented subset is soil (24), agro-ecological zones (34), land use (21), irrigation schemes (26), and groundwater prospects (27). Roads and unrelated layers are omitted.

Explorer controls now request viewport-clipped GeoJSON vectors with individual opacity and geometry detail. See `MAP_DETAIL_GUIDE.md` for expanded water layers, archive imagery and satellite products. My Farm's **Fetch NSDI & latest Sentinel-2** queries regional map units intersecting the boundary, or the point if no polygon exists. Attribute names/aliases come from real service responses. Empty/unavailable results are explicit. Results are not area-weighted statistics and the service's update dates were not established. Regional soil names never silently replace farmer-entered soil texture or storage; a map classification is not a soil test.

## Free 10 m imagery

Earth Search's public STAC collection `sentinel-2-l2a` supplies recent acquisitions, scene dates, tile-wide cloud percentages, provenance and original visual COG links without a paid imagery API. Actual scene responses are archived in `backend/fixtures/sentinel_search.json`.

The selected-field preview reads the native visual COG with bounded byte ranges, reprojects the crop to WGS84, and limits the preview to 1600 pixels per side. This is an actual source crop, not a sharpened basemap or a full-tile thumbnail falsely labeled 10 m. Very large fields may be downsampled; cloud cover is retained and tile-wide cloud percentage is not a field-specific cloud score. The selected polygon masks the preview outside the boundary.

The acquisition selector lets users choose another recent pass. No continuous live video or guaranteed clear image is claimed. If catalog access or crop rendering fails, a visible warning and original source links remain. Fetching source data is explicit; nothing requests a paid service.

## Source modules and endpoints

- `src/components/MapExplorer.tsx`: Cesium lifecycle, Esri imagery, NSDI overlays, vertex drawing and isolated preview.
- `src/components/FieldDetail.tsx`: grouped farm library, NSDI attributes, scene selection and cropped native imagery.
- `src/lib/geometry.ts`: polygon validation, geodesic area and representative center.
- `src/lib/store.tsx`: active farm, independent configurations, migration/persistence.
- `backend/land.py`: allowlisted reference queries, STAC discovery and crop rendering.
- `backend/range_reader.py`: bounded public-COG HTTP reads.
- `GET /api/land/layers`, `POST /api/land/context`, `POST /api/land/sentinel`, `GET /api/land/sentinel/image`.

The previous MapLibre implementation notes in the original architecture guides describe the first release. This document supersedes those geographic-renderer and single-farm storage descriptions. Weather and rotation-model equations remain unchanged.
