# NASA data guide

Investigation date: 31 October 2026. Source URLs and captured responses are evidence of what was inspected, not promises that a service or product will remain unchanged.

## NASA POWER — implemented

[Daily API documentation](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) describes point requests, daily dates, time standards and formats. Genuine full responses are bundled in `backend/fixtures/power_anuradhapura_2024.json` and `power_anuradhapura_2023_2025.json`. The latter has 1,096 daily dates and seven parameters. No authentication is required.

| Parameter             | Meaning                              | Normalized unit |
| --------------------- | ------------------------------------ | --------------- |
| T2M, T2M_MIN, T2M_MAX | Daily air temperature at 2 m         | °C              |
| PRECTOTCORR           | Corrected precipitation              | mm/day          |
| ALLSKY_SFC_SW_DWN     | All-sky downward shortwave radiation | MJ/m²/day       |
| RH2M                  | Relative humidity at 2 m             | %               |
| WS2M                  | Wind speed at 2 m                    | m/s             |

The observed response declares `header.fill_value=-999`, `time_standard=LST`, sources MERRA2/SYN1DEG/POWER, and per-variable units under `parameters`. The AG request returned solar radiation in MJ/m²/day. The parser supports explicitly declared kWh alternatives and converts them by 3.6. It rejects unknown or absent required units.

Meteorological support is approximately 0.5° × 0.625°; solar data are about 1°. A requested point does not turn these products into field sensors. The map grid is an approximate support illustration, not an exact interpolation stencil. POWER meteorology is largely reanalysis; source metadata describes a mixture of modeled and observational information.

`providers/service.py` handles live requests and fallbacks; `providers/power.py` normalizes records. Test fixtures cover dates, missing values, leap years, unit conversions and real response fields. Runtime cache is genuine-only and keyed by complete request URL. The fixture receipt records identity for a subset; it is not falsely timestamped as a new retrieval.

## MODIS MOD13Q1 through ORNL DAAC — implemented

The [official public REST service](https://modis.ornl.gov/rst/) was inspected directly. Its actual Swagger specification is captured in `backend/fixtures/ornl_openapi.json`; the original HTML is also retained. `modis_allbands_sample.json` and `modis_subset_sample.json` contain genuine JSON responses. `scripts/cache_modis.py` downloads the default farm’s full 2023–2025 subsets in bounded 120-day chunks.

Endpoint: `/rst/api/v1/MOD13Q1/subset`. Coordinates are WGS84 decimal degrees; dates are `AYYYYDDD`; `kmAboveBelow=0` and `kmLeftRight=0` select one native pixel. Omitting `band` returns all bands. An actual over-large request returned HTTP 400 explaining the service maximum of ten composite dates; the adapter stays below that limit.

Observed fields include `nrows`, `ncols`, `cellsize`, `xllcorner`, `yllcorner`, `latitude`, `longitude`, `header`, and `subset`. Each subset row supplies `calendar_date`, `modis_date`, `band`, `data`, `tile` and `proc_date`. Native sinusoidal cell size is about 231.656 m for the nominal 250 m product. This is a 16-day composite, not a daily instantaneous observation. No Earthdata credentials were needed for this subset route.

The parser joins NDVI, pixel-reliability and VI-quality bands by composite date. NDVI scale is 0.0001; fill -3000 and raw values outside -2000…10000 are excluded. Accepted data require reliability 0, MODLAND QA bits 0–1 equal to 0, usefulness bits 2–5 no greater than 2, and adjacent cloud/mixed cloud/snow/shadow bits clear. Screened values are withheld in the accepted series. The unscreened valid-range series is visually distinguished for learning.

The service abstracts collection selection and does not put a collection version in its subset response. The app therefore does not assert that every ORNL sample is v061. Separately captured CMR metadata explicitly identifies a v061 original granule. Verify the service’s current collection before research use. [MOD13Q1.061 documentation](https://doi.org/10.5067/MODIS/MOD13Q1.061) supplies product-variable and QA definitions; QA assumptions must be rechecked if the service collection changes.

Vegetation is an independent display layer, never converted into crop identity, soil nutrients, yield or model-score bonuses. Its active mode is shown separately from weather. No synthetic vegetation is generated.

## GPM IMERG — researched, not ingested

[Official IMERG overview](https://gpm.nasa.gov/data/imerg) and [data directory](https://gpm.nasa.gov/data/directory) describe 0.1° gridded precipitation, half-hourly source products and daily/monthly derivatives. Rates and accumulations depend on the specific product/format: mm/h is not interchangeable with mm. GeoTIFF scaling also varies with accumulation period.

`cmr_imerg.json` contains a real discovery response for GPM_3IMERGDF v07: NetCDF4 asset, global bounds, start/end times, GES DISC download URL and OPeNDAP route. The scientific NetCDF file was not downloaded or decoded. Consequently its `_FillValue`, scale/offset, variable dimensions and per-pixel quality were not verified in a file and no raster parser is claimed. Protected GES DISC downloads normally require Earthdata authentication. Next: authenticate outside the client, inspect one file with Xarray, preserve rate/accumulation semantics, then add fixture and unit tests.

## SMAP — researched, not ingested

[SPL3SMP_E v005 product page](https://nsidc.org/data/spl3smp_e/versions/5) describes enhanced daily global/polar 9 km EASE-grid surface soil moisture. Units are m³/m³; a 9 km grid does not imply a 9 km independent radiometer footprint. AM/PM observations and retrieval flags need separate handling. Download access uses Earthdata.

The actual CMR query for short name SPL3SMP_E and version 005 returned zero granules; that empty response is preserved in `cmr_smap.json`. This does not prove the product is unavailable. Collection/version migration needs resolution. No sample HDF5 science file or fill convention was verified; those remain explicit integration prerequisites. Surface soil moisture must not silently replace the model’s farmer-entered root-zone storage.

## ECOSTRESS — researched, not ingested

[Product description](https://doi.org/10.5067/ECOSTRESS/ECO_L2T_LSTE.003) and [JPL product guides](https://ecostress.jpl.nasa.gov/data/atbds-summary-table) describe 70 m L2 tiled land-surface temperature/emissivity, distributed as separate COG assets in v003. Thermal LST is not 2 m air temperature. ISS sampling is irregular; L3 evapotranspiration is a separate product.

`cmr_ecostress.json` preserves an actual L2T LSTE v003 granule: time, footprint and links to LST, QC, cloud/water, emissivity and error assets. Asset bytes were not fetched; Kelvin/scaling, no-data tags and QC bit interpretation must be confirmed per asset/version. Earthdata protected download URLs were observed. No LST or ET measurements are fed to the model.

## Landsat / HLS — researched, not ingested

The [HLS v2 user guide](https://lpdaac.usgs.gov/documents/1698/HLS_User_Guide_V2.pdf) documents 30 m reflectance, fill -9999, scale 0.0001, and Fmask. L30/S30 bands differ; do not use the same NIR band number indiscriminately. Acquisition availability is cloud limited.

`cmr_hls.json` captures a genuine L30 v2 granule with band-specific COGs, Fmask, STAC metadata and acquisition times. Downloads are protected Earthdata assets. No reflectance raster was decoded. Next: fetch matched red/NIR/Fmask COGs; verify projection, scale, no-data and QA; compute NDVI only on compatible valid pixels. Regional satellite rasters require real geospatial processing, not a cosmetic map overlay.

## GIBS visual imagery

[Official GIBS access documentation](https://nasa-gibs.github.io/gibs-api-docs/access-basics/) describes WMS/WMTS, projections and time dimensions. MapExplorer requests dated MODIS Terra true color using WMS EPSG:3857 and a real tile bounding box. Availability and clouds vary. Browse pixels never enter calculations. A remote-service failure leaves the offline atlas usable.

## Reproduce research

`scripts/research_nasa.py` writes real CMR JSON and `research_receipts.json` (request URL, UTC retrieval timestamp, record count). [CMR API documentation](https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html) describes these metadata requests. Metadata samples are not fabricated fixtures and are not science measurements. Existing genuine observations should be preserved when extending integrations.
