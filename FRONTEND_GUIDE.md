# Frontend guide

## Run and navigate

Start FastAPI and `npm run dev`; visit port 3000. The page is a Next.js App Router shell with React client components. `layout.tsx` owns metadata, bundled fonts and global styles; `page.tsx` mounts `TerraProvider` and `Shell`. The workspace has seven views selected by context rather than independent URLs.

Use the guided tour to follow the intended journey. The left rail becomes a menu on narrow screens. Keyboard focus, visible labels, native date/select/range controls, a skip link, reduced-motion CSS and print styling are included. A full accessibility audit and focus-trap treatment for every modal have not been completed.

## State and request lifecycle

`src/lib/store.tsx` is the shared state boundary. `Farm`, `Scenario`, `ClimateQuery`, `Climate`, `Analysis` and `Catalog` types are in `types.ts`. `defaults.ts` contains scenario inputs and sample coordinates, not computed recommendations.

Farm configuration and Learning Mode persist in browser localStorage. Dates, navigation and custom edits are session state. `useResource` serializes the request body, debounces changes 450 ms, clears old results, issues a typed JSON POST and aborts obsolete requests. Error text from HTTP 422 is shown in context. The climate resource precedes analysis; failure in climate disables comparison rather than preserving stale scores.

Custom rotation edits use the same backend and update shared comparison state. The selected strategy is referenced by identifier; the brief reads the actual computed farm snapshot and selected result. Changing input assumptions restores generated strategies. JSON downloads use browser Blob URLs and revoke them after initiating the download.

## Component map

| File                   | Responsibility                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `components/Shell.tsx` | navigation, provider/date controls, guided tour, Learning Mode                     |
| `Overview.tsx`         | landscape summary, sample farm, climate metrics and chart                          |
| `MapExplorer.tsx`      | MapLibre lifecycle, geographic search, basemaps, support grid, low graphics tier   |
| `FarmConfig.tsx`       | farmer assumptions, input bounds, crop preferences and normalized priorities       |
| `RotationStudio.tsx`   | four-slot timelines, explanations, editing and selection                           |
| `ClimateLab.tsx`       | replay/sliders, model results, temporal heatmap, bucket trace                      |
| `VegetationPanel.tsx`  | independent MODIS provider status and quality-screened NDVI                        |
| `Charts.tsx`           | climate timelines, seasonal comparison, criterion bars, Pareto, stress/sensitivity |
| `Evidence.tsx`         | receipts, source catalog, flow diagram, assumptions and crop traits                |
| `DecisionBrief.tsx`    | portable summary and print/JSON actions                                            |
| `UI.tsx`               | panels, notices, loading states, page intros, formatting                           |

## Geographic data

MapLibre is dynamically imported after the client mounts. A ref owns the map and cleanup removes it. Coordinate changes update GeoJSON sources and fly the camera. Clicking supplies normalized WGS84 latitude/longitude; the field-area input remains farmer-entered. No cadastral boundary is inferred.

Basemaps: remote Esri satellite context; bundled Natural Earth land polygons; dated NASA GIBS MODIS true color. The POWER support overlay illustrates a nearby nominal 0.5° × 0.625° meteorological grid. It does not claim exact interpolation weights or field precision. A globe-to-farm camera animation is a map-camera transition, not a photorealistic 3D globe. Low graphics mode renders genuine land geometry through an equirectangular SVG grid and supports location clicks.

Search matches sample farms locally first, then calls Open-Meteo’s geocoding service with the entered place name. Errors offer sample/coordinate entry. Geographic search is not a NASA measurement source. Remote imagery may fail; the atlas is bundled and usable without those services.

## Charts and design system

Recharts renders actual API arrays; it does not manufacture a second client dataset. Monthly climate charts retain source weather when scenario sliders move; model result and stress charts use the scenario response. Missing values remain gaps. The vegetation panel draws a distinct unscreened line and an accepted series; quality-rejected data never enter crop scoring.

`globals.css` defines colors, typography, cards, layouts, breakpoints and print rules. Fonts ship locally through Fontsource packages. Major type scales, a forest-green navigation rail, warm paper surfaces and restrained climate colors form the identity. Prefer component-specific classes and shared tokens over arbitrary new color schemes.

## Exercise

Add wind as a climate-record chart using the existing `daily` API data. Declare the missing frontend field in `types.ts`, show m/s, retain nulls, and label the source mode. Verify it changes when coordinates change and does not change when only hypothetical scenario sliders move. Add an interaction assertion only if the new behavior needs automated coverage; do not test static markup for its own sake.
