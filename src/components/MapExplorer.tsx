'use client';
import { useEffect, useRef, useState } from 'react';
import type * as Cesium from 'cesium';
import { useTerra } from '@/lib/store';
import { fieldGeometry } from '@/lib/geometry';
import { samples } from '@/lib/defaults';
import { MapLayers } from './MapLayers';
import { installRenderRecovery, type RenderState } from '@/lib/mapRuntime';
import {
  BASEMAP_MAX_LEVEL,
  DETAIL_HEIGHT,
  WORLD_HEIGHT,
  imageryZoomMinimum,
  installZoomLimits,
  satelliteProvider,
  setMapHeight,
  viewMetersPerPixel,
  type ImageryCoverage,
} from '@/lib/mapZoom';
let engine: Promise<typeof Cesium> | null = null;
function loadEngine() {
  if (!engine)
    engine = new Promise((resolve, reject) => {
      const w = window as unknown as { CESIUM_BASE_URL: string; Cesium: typeof Cesium };
      w.CESIUM_BASE_URL = '/vendor/cesium/';
      if (w.Cesium) {
        resolve(w.Cesium);
        return;
      }
      const script = document.createElement('script');
      script.src = '/vendor/cesium/Cesium.js';
      script.onload = () => resolve(w.Cesium);
      script.onerror = () => {
        engine = null;
        reject(Error('Cesium runtime could not load. Run npm install to prepare local assets.'));
      };
      document.head.append(script);
    });
  return engine;
}
export function MapExplorer({
  large = false,
  preview = false,
  imageOverlay,
  localOnly = false,
}: {
  localOnly?: boolean;
  large?: boolean;
  preview?: boolean;
  imageOverlay?: { url: string; bounds: number[] };
}) {
  const { farm, farms, selectFarm, addFarm, updateFarm, setView } = useTerra();
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<Cesium.Viewer | null>(null),
    api = useRef<typeof Cesium | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [drawing, setDrawing] = useState(false),
    [points, setPoints] = useState<number[][]>([]),
    [editing, setEditing] = useState(false),
    [showLayers, setShowLayers] = useState(false),
    [search, setSearch] = useState('');
  const drawingRef = useRef(false),
    selectRef = useRef(selectFarm);
  drawingRef.current = drawing;
  selectRef.current = selectFarm;
  const [pickedInfo, setPickedInfo] = useState<Record<string, string> | null>(null);
  const [renderState, setRenderState] = useState<RenderState>('ready');
  const recovery = useRef<ReturnType<typeof installRenderRecovery> | null>(null);
  const [zoomHeight, setZoomHeight] = useState(1_500_000);
  const [tileCap, setTileCap] = useState(BASEMAP_MAX_LEVEL);
  const [coverage, setCoverage] = useState<ImageryCoverage>({
    level: null,
    latitude: (farm.latitude * Math.PI) / 180,
    verified: false,
  });
  const [, resizeZoom] = useState(0);
  const v = ready ? viewer.current : null,
    C = api.current;
  const latitude = Math.max(
    -1.4844,
    Math.min(1.4844, v?.camera.positionCartographic.latitude ?? coverage.latitude),
  );
  const sourceMpp =
    (156543.033928 * Math.cos(latitude)) / 2 ** Math.min(tileCap, coverage.level ?? tileCap);
  const minimumHeight = localOnly
    ? 430_000
    : v && C
      ? imageryZoomMinimum(v, C, Math.min(tileCap, coverage.level ?? tileCap), latitude)
      : DETAIL_HEIGHT;
  const viewMpp = v && C ? viewMetersPerPixel(v, C) : 1;
  const zoomLevel = Math.log2((156543.033928 * Math.cos(latitude)) / Math.max(0.0001, viewMpp));
  const minimumLevel = Math.floor((zoomLevel - Math.log2(WORLD_HEIGHT / zoomHeight)) * 10) / 10;
  const maximumLevel =
    Math.ceil((zoomLevel + Math.log2(zoomHeight / minimumHeight)) * 10 - 0.000001) / 10;
  const atDetailLimit = zoomHeight <= minimumHeight + 0.6;
  const scaleTarget = viewMpp * 90;
  const scalePower = 10 ** Math.floor(Math.log10(scaleTarget));
  const scaleDistance = [5, 2, 1].find((n) => n * scalePower <= scaleTarget)! * scalePower;
  const distanceLabel = (meters: number) =>
    meters >= 1000
      ? `${(meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
      : `${meters.toLocaleString(undefined, { maximumFractionDigits: meters < 1 ? 2 : 0 })} m`;
  useEffect(() => {
    if (!ready || !viewer.current) return;
    const map = viewer.current;
    const refresh = () => resizeZoom((n) => n + 1);
    const resize = new ResizeObserver(refresh);
    resize.observe(map.canvas);
    const remove = map.scene.morphComplete.addEventListener(refresh);
    return () => {
      resize.disconnect();
      remove();
    };
  }, [ready]);
  useEffect(() => {
    if (!ready || !viewer.current || !api.current) return;
    return installZoomLimits(viewer.current, api.current, minimumHeight, setZoomHeight);
  }, [ready, minimumHeight]);
  function zoomTo(height: number) {
    if (viewer.current && api.current) setMapHeight(viewer.current, api.current, height);
  }
  function zoomToLevel(level: number) {
    zoomTo(zoomHeight * 2 ** (zoomLevel - level));
  }
  useEffect(() => {
    const v = viewer.current,
      C = api.current;
    const overlay = localOnly
      ? { url: '/data/sri-lanka-blue-marble.jpg', bounds: [79, 6, 82, 10] }
      : imageOverlay;
    if (!ready || !v || !C || !overlay) return;
    let disposed = false;
    let layer: Cesium.ImageryLayer | undefined;
    C.SingleTileImageryProvider.fromUrl(overlay.url, {
      rectangle: C.Rectangle.fromDegrees(...(overlay.bounds as [number, number, number, number])),
      credit: localOnly
        ? 'NASA GIBS Blue Marble'
        : 'Copernicus Sentinel-2 / Earth Search · acquisition selected below',
    })
      .then((p) => {
        if (disposed) return;
        layer = v.imageryLayers.addImageryProvider(p);
        v.scene.requestRender();
      })
      .catch(() => {
        if (!disposed) setError('Regional imagery could not be loaded.');
      });
    return () => {
      disposed = true;
      if (layer && !v.isDestroyed()) v.imageryLayers.remove(layer);
    };
  }, [ready, localOnly, imageOverlay?.url]);
  useEffect(() => {
    let disposed = false;
    loadEngine()
      .then((C) => {
        if (disposed || !host.current) return;
        api.current = C;
        try {
          const v = new C.Viewer(host.current, {
            baseLayer: false,
            animation: false,
            timeline: false,
            geocoder: false,
            baseLayerPicker: false,
            sceneModePicker: true,
            navigationHelpButton: false,
            homeButton: false,
            fullscreenButton: false,
            selectionIndicator: false,
            infoBox: false,
            requestRenderMode: true,
            showRenderLoopErrors: false,
            terrainProvider: new C.EllipsoidTerrainProvider(),
          });
          viewer.current = v;
          recovery.current = installRenderRecovery(v, C, setRenderState);
          v.imageryLayers.addImageryProvider(
            localOnly
              ? new C.UrlTemplateImageryProvider({
                  url: '/vendor/cesium/Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg',
                  tilingScheme: new C.GeographicTilingScheme(),
                  maximumLevel: 2,
                  credit: 'Natural Earth II',
                })
              : satelliteProvider(
                  C,
                  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                  BASEMAP_MAX_LEVEL,
                ),
          );
          v.scene.globe.baseColor = C.Color.fromCssColorString('#344e3b');
          v.screenSpaceEventHandler.removeInputAction(C.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          v.screenSpaceEventHandler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
            const hit = v.camera.pickEllipsoid(event.position, v.scene.globe.ellipsoid);
            if (!hit) return;
            if (drawingRef.current) {
              const p = C.Cartographic.fromCartesian(hit);
              setPoints((old) => [
                ...old,
                [C.Math.toDegrees(p.longitude), C.Math.toDegrees(p.latitude)],
              ]);
            } else {
              const picked = v.scene.pick(event.position);
              if (picked?.id?.properties?.farmId) {
                selectRef.current(picked.id.properties.farmId.getValue());
                setPickedInfo(null);
              } else if (picked?.id?.properties) {
                const p = picked.id.properties;
                setPickedInfo(
                  Object.fromEntries(
                    p.propertyNames
                      .filter((k: string) => !k.startsWith('__') && !k.includes('shape'))
                      .map((k: string) => [k, String(p[k].getValue()).slice(0, 200)]),
                  ),
                );
              } else setPickedInfo(null);
            }
          }, C.ScreenSpaceEventType.LEFT_CLICK);
          v.camera.setView({
            destination: C.Cartesian3.fromDegrees(
              farm.longitude,
              farm.latitude,
              preview ? 2000 : 1500000,
            ),
          });
          setReady(true);
        } catch (e) {
          setError((e as Error).message);
        }
      })
      .catch((e) => setError(e.message));
    return () => {
      disposed = true;
      recovery.current?.dispose();
      recovery.current = null;
      if (viewer.current && !viewer.current.isDestroyed()) viewer.current.destroy();
      viewer.current = null;
    };
  }, []);
  useEffect(() => {
    const v = viewer.current,
      C = api.current;
    if (!v || !C || !ready) return;
    v.entities.removeAll();
    for (const f of preview ? [farm] : farms) {
      const selected = f.id === farm.id;
      const positions = f.boundary?.length
        ? C.Cartesian3.fromDegreesArray(f.boundary.flat())
        : null;
      if (positions && positions.length >= 3) {
        v.entities.add({
          properties: { farmId: f.id },
          polygon: {
            hierarchy: new C.PolygonHierarchy(positions),
            material: C.Color.fromCssColorString(selected ? '#d4e7a0' : '#84bdb0').withAlpha(0.15),
            outline: true,
            outlineColor: C.Color.WHITE,
          },
          polyline: {
            positions: [...positions, positions[0]],
            width: selected ? 3 : 1.5,
            material: C.Color.fromCssColorString(selected ? '#e4f3b9' : '#84bdb0'),
          },
        });
      }
      v.entities.add({
        position: C.Cartesian3.fromDegrees(f.longitude, f.latitude),
        properties: { farmId: f.id },
        point: {
          pixelSize: 9,
          color: selected ? C.Color.YELLOW : C.Color.CYAN,
          outlineColor: C.Color.BLACK,
          outlineWidth: 2,
        },
        label: {
          text: f.name,
          font: '13px sans-serif',
          pixelOffset: new C.Cartesian2(0, -22),
          showBackground: true,
          backgroundColor: C.Color.BLACK.withAlpha(0.65),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
    for (const [i, p] of points.entries())
      v.entities.add({
        position: C.Cartesian3.fromDegrees(p[0], p[1]),
        point: {
          pixelSize: 9,
          color: C.Color.YELLOW,
          outlineWidth: 2,
          outlineColor: C.Color.BLACK,
        },
        label: {
          text: String(i + 1),
          pixelOffset: new C.Cartesian2(0, -18),
          font: '12px sans-serif',
        },
      });
    if (points.length >= 2)
      v.entities.add({
        polyline: {
          positions: C.Cartesian3.fromDegreesArray(points.flat()),
          width: 3,
          material: C.Color.YELLOW,
        },
      });
    if (points.length >= 3)
      v.entities.add({
        polygon: {
          hierarchy: C.Cartesian3.fromDegreesArray(points.flat()),
          material: C.Color.YELLOW.withAlpha(0.2),
        },
      });
    v.scene.requestRender();
  }, [ready, JSON.stringify(farms), JSON.stringify(points), farm.id, preview]);
  useEffect(() => {
    const v = viewer.current,
      C = api.current;
    if (!v || !C || !ready) return;
    if (farm.boundary?.length) {
      const b = farm.boundary;
      const west = Math.min(...b.map((p) => p[0])),
        east = Math.max(...b.map((p) => p[0])),
        south = Math.min(...b.map((p) => p[1])),
        north = Math.max(...b.map((p) => p[1]));
      v.camera.flyTo({
        destination: C.Rectangle.fromDegrees(
          west - 0.001,
          south - 0.001,
          east + 0.001,
          north + 0.001,
        ),
        duration: 1.3,
      });
      if (preview && C.ClippingPolygonCollection.isSupported(v.scene))
        v.scene.globe.clippingPolygons = new C.ClippingPolygonCollection({
          polygons: [new C.ClippingPolygon({ positions: C.Cartesian3.fromDegreesArray(b.flat()) })],
          inverse: true,
        });
    } else
      v.camera.flyTo({
        destination: C.Cartesian3.fromDegrees(
          farm.longitude,
          farm.latitude,
          preview ? 1800 : localOnly ? 430000 : 14000,
        ),
        duration: 1.5,
      });
  }, [ready, farm.id, JSON.stringify(farm.boundary), preview]);
  function finish() {
    try {
      const result = fieldGeometry(points);
      if (editing) updateFarm(result);
      else addFarm({ ...result, category: 'Sri Lanka pilot' });
      setDrawing(false);
      setPoints([]);
      setView('farm');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function find(e: React.FormEvent) {
    e.preventDefault();
    const sample = samples.find((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    let lat = sample?.latitude,
      lon = sample?.longitude;
    if (!sample && !localOnly)
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=1`,
        );
        const d = await r.json();
        lat = d.results?.[0]?.latitude;
        lon = d.results?.[0]?.longitude;
      } catch {}
    if (lat == null || lon == null) {
      setError('Location not found. Try a city or town name, including its country.');
      return;
    }
    const C = api.current;
    if (C) viewer.current?.camera.flyTo({ destination: C.Cartesian3.fromDegrees(lon, lat, 8000) });
  }
  return (
    <div
      className={`map-card cesium-map ${large ? 'large' : ''} ${preview ? 'farm-isolated' : ''}`}
      data-map-ready={ready}
      data-map-render-state={renderState}
      data-map-height={Math.round(zoomHeight)}
      data-map-min-height={minimumHeight}
    >
      <div ref={host} className="map-surface" />
      {!preview && (
        <div className="map-top">
          <form className="map-search" onSubmit={find}>
            <input
              aria-label="Search geographic location"
              placeholder="Find a city or town worldwide"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button>Find</button>
          </form>
          <button className="map-pill" onClick={() => setShowLayers(!showLayers)}>
            {localOnly ? 'Local imagery' : 'Map detail & layers'}
          </button>
          <button
            className="map-pill"
            onClick={() => {
              setEditing(false);
              setPoints([]);
              setDrawing(true);
              setError('');
            }}
          >
            Draw a new farm
          </button>
        </div>
      )}
      {localOnly ? (
        showLayers && (
          <aside className="map-layer-panel">
            <strong>Local imagery</strong>
            <p>Natural Earth II · global basemap</p>
            <p>NASA Blue Marble · Sri Lanka</p>
            <button onClick={() => setShowLayers(false)}>Close</button>
          </aside>
        )
      ) : (
        <MapLayers
          viewer={ready ? viewer.current : null}
          engine={api.current}
          open={showLayers}
          onClose={() => setShowLayers(false)}
          cap={tileCap}
          onCapChange={setTileCap}
          onZoom={zoomTo}
          coverage={coverage}
          onCoverage={setCoverage}
        />
      )}
      {ready && (
        <div className="map-zoom-control" role="group" aria-label="Map zoom controls">
          <div className="map-zoom-heading">
            <strong>Zoom {zoomLevel.toFixed(1)}</strong>
            <span>Max {maximumLevel.toFixed(1)}</span>
          </div>
          <div className="map-zoom-slider">
            <button
              aria-label="Zoom out one stage"
              disabled={zoomHeight >= WORLD_HEIGHT - 2}
              onClick={() => zoomToLevel(Math.floor(zoomLevel - 0.05))}
            >
              −
            </button>
            <input
              type="range"
              aria-label="Map zoom level"
              min={minimumLevel}
              max={maximumLevel}
              step={0.1}
              value={Number(zoomLevel.toFixed(1))}
              aria-valuetext={`Zoom ${zoomLevel.toFixed(1)} of ${maximumLevel.toFixed(1)}`}
              onChange={(e) => zoomToLevel(Number(e.target.value))}
            />
            <button
              aria-label="Zoom in one stage"
              disabled={atDetailLimit}
              onClick={() => zoomToLevel(Math.ceil(zoomLevel + 0.05))}
            >
              +
            </button>
          </div>
          <dl className="map-zoom-facts">
            <div>
              <dt>View scale ≈</dt>
              <dd>{viewMpp.toLocaleString(undefined, { maximumFractionDigits: 2 })} m / pixel</dd>
            </div>
            <div>
              <dt>Camera height</dt>
              <dd>{distanceLabel(zoomHeight)}</dd>
            </div>
            <div>
              <dt>Available tiles</dt>
              <dd>{coverage.verified ? `Level ${coverage.level}` : 'Not verified'}</dd>
            </div>
            {coverage.verified && (
              <div>
                <dt>Tile pixel size</dt>
                <dd>≈ {sourceMpp.toFixed(2)} m</dd>
              </div>
            )}
          </dl>
          <div className="map-distance-scale">
            <span style={{ width: `${scaleDistance / viewMpp}px` }} />
            {distanceLabel(scaleDistance)}
          </div>
          <small>
            {atDetailLimit ? 'Maximum zoom reached' : 'Scroll to zoom · + / − for whole levels'}
          </small>
          {coverage.verified && sourceMpp > viewMpp * 1.05 && (
            <small>Image magnified {(sourceMpp / viewMpp).toFixed(1)}× · no added detail</small>
          )}
        </div>
      )}
      {pickedInfo && (
        <div className="map-feature-info">
          <button onClick={() => setPickedInfo(null)}>Close ×</button>
          <strong>Mapped feature attributes</strong>
          {Object.entries(pickedInfo).map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
      )}
      {drawing && (
        <div className="draw-toolbar">
          <strong>
            {editing ? 'Edit boundary' : 'New farm boundary'} · {points.length} points
          </strong>
          <span>Click around the perimeter, then save.</span>
          <button onClick={() => setPoints((p) => p.slice(0, -1))}>Undo point</button>
          <button disabled={points.length < 3} onClick={finish}>
            Save farm area
          </button>
          <button
            onClick={() => {
              setDrawing(false);
              setPoints([]);
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {preview && (
        <div className="map-top">
          <span className="map-pill">Isolated field · {farm.area_ha} ha</span>
          <button className="map-pill" onClick={() => setShowLayers(!showLayers)}>
            {localOnly ? 'Local imagery' : 'Map detail & layers'}
          </button>
          <button
            className="map-pill"
            onClick={() => {
              setEditing(true);
              setPoints(farm.boundary || []);
              setDrawing(true);
            }}
          >
            Edit boundary
          </button>
          <button className="map-pill" onClick={() => setView('explorer')}>
            Open Earth Explorer ↗
          </button>
        </div>
      )}
      {!ready && !error && (
        <div className="map-caption">
          <h2>Opening your Earth…</h2>
        </div>
      )}
      {error && (
        <div className="map-error" role="alert">
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      {renderState !== 'ready' && (
        <div className="map-error" role={renderState === 'failed' ? 'alert' : 'status'}>
          {renderState === 'recovering'
            ? 'Rebuilding map tiles… Your farm and layers are kept.'
            : renderState === 'recovered'
              ? 'Map recovered after a terrain-tile error. Your farm and layers were kept.'
              : 'Map rendering stopped. Restart the map to continue; your saved farms are kept.'}
          {renderState === 'failed' && (
            <button onClick={() => recovery.current?.restart()}>Restart map rendering</button>
          )}
          {renderState === 'recovered' && (
            <button onClick={() => setRenderState('ready')}>Dismiss</button>
          )}
        </div>
      )}
      <div className="map-bottom">
        <span>
          {farm.latitude.toFixed(4)}°, {farm.longitude.toFixed(4)}° · CesiumJS ·{' '}
          {localOnly
            ? 'Natural Earth II / NASA Blue Marble'
            : 'Esri visual imagery · acquisition dates vary'}
        </span>
      </div>
    </div>
  );
}
