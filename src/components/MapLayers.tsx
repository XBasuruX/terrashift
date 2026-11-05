'use client';
import { useEffect, useRef, useState } from 'react';
import type * as Cesium from 'cesium';
import {
  BASEMAP_MAX_LEVEL,
  satelliteProvider,
  installImageryCoverage,
  type ImageryCoverage,
} from '@/lib/mapZoom';
type Settings = {
  id: number;
  name: string;
  group: string;
  enabled: boolean;
  opacity: number;
  detail: string;
};
const initial: Settings[] = [
  {
    id: 24,
    name: 'Soil classification',
    group: 'Soil',
    enabled: false,
    opacity: 0.28,
    detail: 'balanced',
  },
  {
    id: 25,
    name: 'Soil conservation areas',
    group: 'Soil',
    enabled: false,
    opacity: 0.22,
    detail: 'balanced',
  },
  {
    id: 9,
    name: 'Village tanks',
    group: 'Water',
    enabled: false,
    opacity: 0.7,
    detail: 'balanced',
  },
  { id: 14, name: 'Lakes', group: 'Water', enabled: false, opacity: 0.7, detail: 'balanced' },
  { id: 17, name: 'Rivers', group: 'Water', enabled: false, opacity: 0.8, detail: 'balanced' },
  { id: 18, name: 'Reservoirs', group: 'Water', enabled: false, opacity: 0.7, detail: 'balanced' },
  {
    id: 26,
    name: 'Irrigation schemes',
    group: 'Water',
    enabled: false,
    opacity: 0.45,
    detail: 'balanced',
  },
  {
    id: 27,
    name: 'Groundwater prospects',
    group: 'Water',
    enabled: false,
    opacity: 0.25,
    detail: 'balanced',
  },
  {
    id: 34,
    name: 'Agro-ecological zones',
    group: 'Land',
    enabled: false,
    opacity: 0.2,
    detail: 'balanced',
  },
  { id: 21, name: 'Land use', group: 'Land', enabled: false, opacity: 0.2, detail: 'balanced' },
];
const palette = ['#c89b6d', '#a5c87b', '#dbbd6e', '#af98c2', '#79b3a4', '#d79685'];
export function classColor(label: string) {
  let n = 0;
  for (const c of label) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return palette[n % palette.length];
}
export function MapLayers({
  viewer: v,
  engine: C,
  open,
  onClose,
  cap,
  onCapChange,
  onZoom,
  coverage,
  onCoverage,
}: {
  viewer: Cesium.Viewer | null;
  engine: typeof Cesium | null;
  open: boolean;
  onClose: () => void;
  cap: number;
  onCapChange: (cap: number) => void;
  onZoom: (height: number) => void;
  coverage: ImageryCoverage;
  onCoverage: (coverage: ImageryCoverage) => void;
}) {
  const [layers, setLayers] = useState(initial),
    [status, setStatus] = useState<Record<number, string>>({}),
    [legend, setLegend] = useState<Record<number, string[]>>({}),
    [quality, setQuality] = useState('balanced'),
    [viewScale, setViewScale] = useState('—'),
    [reload, setReload] = useState(0);
  const [baseSource, setBaseSource] = useState('current'),
    [alternatives, setAlternatives] = useState<{ id: string; name: string; url: string }[]>([]);
  useEffect(() => {
    fetch('/api/land/imagery-options')
      .then((r) => r.json())
      .then((d) => setAlternatives(d.options || []))
      .catch(() => {});
  }, []);
  const sources = useRef<Record<number, Cesium.GeoJsonDataSource>>({});
  const basemap = useRef<{ viewer: Cesium.Viewer; layer: Cesium.ImageryLayer } | null>(null);
  const baseUrl =
    baseSource === 'current'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : baseSource === 'clarity'
        ? 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : alternatives.find((a) => a.id === baseSource)?.url;
  const revision = useRef(0);
  const effectiveCap = Math.min(cap, coverage.level ?? cap);
  useEffect(() => {
    if (!v || !C || !baseUrl) return;
    onCoverage({ level: null, latitude: v.camera.positionCartographic.latitude, verified: false });
    return installImageryCoverage(v, C, baseUrl, cap, onCoverage);
  }, [v, C, baseUrl, cap, onCoverage]);
  const patch = (id: number, p: Partial<Settings>) =>
    setLayers((old) => old.map((l) => (l.id === id ? { ...l, ...p } : l)));
  useEffect(() => {
    if (!v || !C) return;
    const update = () => {
      setReload((n) => n + 1);
      const rect = v.camera.computeViewRectangle();
      if (rect)
        setViewScale(
          (
            (C.Math.toDegrees(rect.east - rect.west) *
              111320 *
              Math.cos((rect.north + rect.south) / 2)) /
            Math.max(1, v.canvas.clientWidth)
          ).toFixed(1),
        );
    };
    const remove = v.camera.moveEnd.addEventListener(update);
    update();
    return remove;
  }, [v, C]);
  useEffect(() => {
    if (!v || !C) return;
    v.scene.globe.maximumScreenSpaceError = quality === 'fast' ? 4 : 2;
    v.resolutionScale =
      quality === 'fine'
        ? Math.min(window.devicePixelRatio || 1, 2)
        : quality === 'fast'
          ? 0.75
          : 1;
    v.scene.requestRender();
  }, [v, C, quality]);
  useEffect(() => {
    if (!v || !C || !baseUrl) return;
    const old = basemap.current?.viewer === v ? basemap.current.layer : v.imageryLayers.get(0);
    if (
      old?.imageryProvider instanceof C.UrlTemplateImageryProvider &&
      old.imageryProvider.url === baseUrl &&
      old.imageryProvider.maximumLevel === effectiveCap
    ) {
      basemap.current = { viewer: v, layer: old };
      return;
    }
    // Add first so Cesium never traverses a globe with its base layer removed.
    // Track ownership rather than accidentally removing a Sentinel overlay.
    const layer = v.imageryLayers.addImageryProvider(
      satelliteProvider(C, baseUrl, effectiveCap),
      0,
    );
    basemap.current = { viewer: v, layer };
    if (old && v.imageryLayers.contains(old)) v.imageryLayers.remove(old);
    v.scene.requestRender();
  }, [v, C, effectiveCap, baseUrl]);
  useEffect(() => {
    if (!v || !C) return;
    const controller = new AbortController();
    const current = ++revision.current;
    const timer = setTimeout(() => {
      const rect = v.camera.computeViewRectangle();
      if (!rect) return;
      const bbox = [
        C.Math.toDegrees(rect.west),
        C.Math.toDegrees(rect.south),
        C.Math.toDegrees(rect.east),
        C.Math.toDegrees(rect.north),
      ];
      const active = new Set(layers.filter((l) => l.enabled).map((l) => l.id));
      for (const [id, source] of Object.entries(sources.current))
        if (!active.has(+id)) {
          v.dataSources.remove(source, true);
          delete sources.current[+id];
        }
      for (const l of layers.filter((l) => l.enabled)) {
        if (bbox[2] - bbox[0] > 3 || bbox[3] - bbox[1] > 3) {
          setStatus((s) => ({ ...s, [l.id]: 'Zoom closer to load vectors' }));
          if (sources.current[l.id]) {
            v.dataSources.remove(sources.current[l.id], true);
            delete sources.current[l.id];
          }
          continue;
        }
        setStatus((s) => ({ ...s, [l.id]: 'Loading clipped vectors…' }));
        fetch(`/api/land/vectors/${l.id}?bbox=${bbox.join(',')}&detail=${l.detail}`, {
          signal: controller.signal,
        })
          .then(async (r) => {
            const d = await r.json();
            if (!r.ok) throw Error(d.detail || 'Service unavailable');
            const source = await C.GeoJsonDataSource.load(d, {
              clampToGround: true,
              strokeWidth: l.group === 'Water' ? 3 : 1.5,
            });
            if (controller.signal.aborted || current !== revision.current || v.isDestroyed()) {
              return;
            }
            for (const e of source.entities.values) {
              const label = e.properties?.__label?.getValue() || l.name;
              const color = C.Color.fromCssColorString(
                l.group === 'Water' ? '#3ba9d6' : classColor(label),
              );
              if (e.polygon) {
                e.polygon.material = new C.ColorMaterialProperty(color.withAlpha(l.opacity));
                e.polygon.outline = new C.ConstantProperty(true);
                e.polygon.outlineColor = new C.ConstantProperty(color.withAlpha(0.95));
              }
              if (e.polyline) {
                e.polyline.material = new C.ColorMaterialProperty(color.withAlpha(l.opacity));
                e.polyline.width = new C.ConstantProperty(3);
              }
              if (e.billboard) {
                e.billboard = undefined;
                e.point = new C.PointGraphics({
                  pixelSize: 7,
                  color: color.withAlpha(l.opacity),
                  outlineColor: C.Color.WHITE,
                  outlineWidth: 1,
                });
              }
            }
            const old = sources.current[l.id];
            if (old) v.dataSources.remove(old, true);
            sources.current[l.id] = source;
            await v.dataSources.add(source);
            setLegend((s) => ({
              ...s,
              [l.id]: [
                ...new Set(
                  d.features.map((f: { properties: { __label: string } }) => f.properties.__label),
                ),
              ] as string[],
            }));
            setStatus((s) => ({
              ...s,
              [l.id]: `${d.features.length} features · ${d.metadata.truncated ? 'limit reached; zoom closer' : l.detail + ' geometry'}`,
            }));
            v.scene.requestRender();
          })
          .catch((e) => {
            if (!controller.signal.aborted) setStatus((s) => ({ ...s, [l.id]: e.message }));
          });
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    v,
    C,
    JSON.stringify(layers.map((l) => ({ id: l.id, enabled: l.enabled, detail: l.detail }))),
    reload,
  ]);
  useEffect(
    () => () => {
      if (v && !v.isDestroyed())
        for (const s of Object.values(sources.current)) v.dataSources.remove(s, true);
    },
    [v],
  );
  useEffect(() => {
    if (!v || !C) return;
    for (const l of layers) {
      const source = sources.current[l.id];
      if (!source) continue;
      for (const e of source.entities.values) {
        const label = e.properties?.__label?.getValue() || l.name;
        const color = C.Color.fromCssColorString(
          l.group === 'Water' ? '#3ba9d6' : classColor(label),
        );
        if (e.polygon) e.polygon.material = new C.ColorMaterialProperty(color.withAlpha(l.opacity));
        if (e.polyline)
          e.polyline.material = new C.ColorMaterialProperty(color.withAlpha(l.opacity));
        if (e.point) e.point.color = new C.ConstantProperty(color.withAlpha(l.opacity));
      }
    }
    v.scene.requestRender();
  }, [v, C, JSON.stringify(layers.map((l) => l.opacity)), JSON.stringify(status)]);
  function zoom(mpp: number) {
    if (!v || !C) return;
    onZoom((mpp * v.canvas.clientHeight) / 0.82);
  }
  if (!open) return null;
  return (
    <aside className="map-layer-panel optimized-layers">
      <div className="layer-panel-title">
        <strong>Map clarity & highlights</strong>
        <button onClick={onClose}>Close ×</button>
      </div>
      <label>
        Image source / archive
        <select
          aria-label="Basemap imagery source"
          value={baseSource}
          onChange={(e) => setBaseSource(e.target.value)}
        >
          <option value="current">Esri current mosaic</option>
          <option value="clarity">Esri Clarity · may be older</option>
          {alternatives.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <small>
        Compare archive mosaics if current imagery is blurry/cloudy. Dates are archive publication
        dates, not acquisition dates; detail varies by location.
      </small>
      <label>
        Display quality
        <select
          aria-label="Map display quality"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
        >
          <option value="fast">Fast</option>
          <option value="balanced">Balanced</option>
          <option value="fine">Fine / high DPI</option>
        </select>
      </label>
      <label>
        Basemap tile zoom cap
        <select
          aria-label="Basemap tile zoom cap"
          value={cap}
          onChange={(e) => onCapChange(+e.target.value)}
        >
          {[17, 19, 21, BASEMAP_MAX_LEVEL].map((n) => (
            <option key={n} value={n}>
              Level {n}
            </option>
          ))}
        </select>
      </label>
      <small>
        Available detail is checked at the map center. Closer inspection magnifies the last
        available image up to 4×.
      </small>
      <div className="map-zoom-presets">
        {[1, 5, 20].map((n) => (
          <button key={n} onClick={() => zoom(n)}>
            {n} m/px view
          </button>
        ))}
      </div>
      <small>
        View ≈ {viewScale} m/pixel. Tile levels and display quality do not improve source accuracy.
        Esri source resolution and acquisition dates vary.
      </small>
      <div className="map-zoom-presets">
        <button
          onClick={() =>
            setLayers((l) => l.map((x) => ({ ...x, enabled: x.group === 'Water' && x.id !== 27 })))
          }
        >
          Water highlights
        </button>
        <button
          onClick={() => setLayers((l) => l.map((x) => ({ ...x, enabled: x.group === 'Soil' })))}
        >
          Soil highlights
        </button>
        <button onClick={() => setLayers((l) => l.map((x) => ({ ...x, enabled: false })))}>
          Clear
        </button>
      </div>
      {['Soil', 'Water', 'Land'].map((group) => (
        <div key={group}>
          <h4>{group}</h4>
          {layers
            .filter((l) => l.group === group)
            .map((l) => (
              <div className="layer-row" key={l.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={l.enabled}
                    onChange={(e) => patch(l.id, { enabled: e.target.checked })}
                  />
                  {l.name}
                </label>
                {l.enabled && (
                  <>
                    <label>
                      Opacity
                      <input
                        aria-label={`${l.name} opacity`}
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={l.opacity}
                        onChange={(e) => patch(l.id, { opacity: +e.target.value })}
                      />
                    </label>
                    <label>
                      Geometry detail
                      <select
                        aria-label={`${l.name} detail`}
                        value={l.detail}
                        onChange={(e) => patch(l.id, { detail: e.target.value })}
                      >
                        <option value="overview">Overview · simplified</option>
                        <option value="balanced">Balanced</option>
                        <option value="native">Native source vertices</option>
                      </select>
                    </label>
                    <small role="status">{status[l.id] || 'Waiting for view'}</small>
                    <div className="vector-legend">
                      {legend[l.id]?.slice(0, 6).map((name) => (
                        <span key={name}>
                          <i
                            style={{
                              background: l.group === 'Water' ? '#3ba9d6' : classColor(name),
                            }}
                          />
                          {name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      ))}
      <small>
        NSDI regional classifications are not soil moisture measurements. Water features represent
        mapped water, not current water level. Click a feature to inspect its attributes. Geometry
        simplification changes rendering, not survey resolution.
      </small>
      <a href="https://nsdi.gov.lk/thematic-maps" target="_blank" rel="noreferrer">
        NSDI map library ↗
      </a>
    </aside>
  );
}
