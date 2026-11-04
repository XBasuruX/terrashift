'use client';
import { useState, useEffect } from 'react';
import { useTerra, useResource } from '@/lib/store';
import { Panel, Notice, Busy, LinkOut } from './UI';
import { MapExplorer } from './MapExplorer';
export function FarmLibrary() {
  const { farms, farm, selectFarm, addFarm, setView } = useTerra();
  return (
    <Panel
      title="Your farms"
      eyebrow="SEPARATE FIELDS · SEPARATE ASSUMPTIONS"
      action={
        <button className="button secondary" onClick={() => setView('explorer')}>
          Draw another farm
        </button>
      }
    >
      {[...new Set(farms.map((f) => f.category || 'Sri Lanka pilot'))].map((category) => (
        <div key={category}>
          <h4>{category}</h4>
          <div className="farm-library">
            {farms
              .filter((f) => (f.category || 'Sri Lanka pilot') === category)
              .map((f) => (
                <button
                  key={f.id}
                  className={`farm-entity ${f.id === farm.id ? 'selected' : ''}`}
                  onClick={() => selectFarm(f.id!)}
                >
                  <strong>{f.name}</strong>
                  <span>
                    {f.area_ha} ha · {f.boundary?.length || 0} boundary points
                  </span>
                  <small>
                    {f.latitude.toFixed(4)}°, {f.longitude.toFixed(4)}° · {f.soil} ·{' '}
                    {f.irrigation_mm} mm irrigation
                  </small>
                </button>
              ))}
          </div>
        </div>
      ))}
      <small className="chart-note">
        Each field retains its own crops, soil assumptions, water limits and priorities. Weather
        remains coarse-grid data; nearby fields may share weather observations.
      </small>
    </Panel>
  );
}

type Context = {
  layers: {
    id: number;
    name: string;
    status: string;
    records: Record<string, unknown>[];
    source: string;
  }[];
  retrieved_at: string;
  scope: string;
};
type Scene = {
  id: string;
  date: string;
  cloud: number;
  resolution: number;
  visual: string;
  source: string;
};
type Scenes = { scenes: Scene[]; bbox: number[]; note: string };
export function FieldDetail() {
  const { farm, updateFarm } = useTerra();
  const query = {
    latitude: farm.latitude,
    longitude: farm.longitude,
    boundary: farm.boundary || [],
  };
  const [inspect, setInspect] = useState(false);
  const key = JSON.stringify(query);
  const context = useResource<Context>('land/context', query, inspect);
  const sentinel = useResource<Scenes>('land/sentinel', query, inspect);
  const [product, setProduct] = useState('truecolor'),
    [sampling, setSampling] = useState(10),
    [mapOverlay, setMapOverlay] = useState(false),
    [crisp, setCrisp] = useState(true),
    [full, setFull] = useState(false),
    [zoom, setZoom] = useState(1),
    [preferClear, setPreferClear] = useState(true);
  const [scene, setScene] = useState(''),
    [failed, setFailed] = useState(false),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setInspect(false);
    setScene('');
    setFull(false);
    setZoom(1);
    setDetailCenter(null);
    setMapOverlay(false);
  }, [key]);
  const scenes = sentinel.data?.scenes || [];
  const chosen =
    scenes.find((s) => s.id === scene) ||
    (preferClear ? [...scenes].sort((a, b) => (a.cloud ?? 100) - (b.cloud ?? 100))[0] : scenes[0]);
  const b = farm.boundary?.length
    ? farm.boundary
    : [
        [farm.longitude - 0.005, farm.latitude - 0.005],
        [farm.longitude + 0.005, farm.latitude + 0.005],
      ];
  const bounds = [
    Math.min(...b.map((p) => p[0])) - 0.00015,
    Math.min(...b.map((p) => p[1])) - 0.00015,
    Math.max(...b.map((p) => p[0])) + 0.00015,
    Math.max(...b.map((p) => p[1])) + 0.00015,
  ];
  const image = chosen
    ? `/api/land/sentinel/image?scene=${encodeURIComponent(chosen.id)}&bbox=${bounds.join(',')}&sampling=${product === 'ndmi' ? Math.max(20, sampling) : sampling}&product=${product}`
    : '';
  const [detailCenter, setDetailCenter] = useState<number[] | null>(null),
    [detailImage, setDetailImage] = useState(''),
    [detailReady, setDetailReady] = useState(false),
    [detailError, setDetailError] = useState(false);
  const center = detailCenter || [farm.longitude, farm.latitude];
  const dx = (bounds[2] - bounds[0]) / zoom,
    dy = (bounds[3] - bounds[1]) / zoom;
  const detailWest = Math.max(bounds[0], Math.min(bounds[2] - dx, center[0] - dx / 2)),
    detailSouth = Math.max(bounds[1], Math.min(bounds[3] - dy, center[1] - dy / 2));
  const detailBounds = [detailWest, detailSouth, detailWest + dx, detailSouth + dy];
  const requestedDetail = chosen
    ? `/api/land/sentinel/image?scene=${chosen.id}&bbox=${detailBounds.join(',')}&sampling=${product === 'ndmi' ? Math.max(20, sampling) : sampling}&product=${product}`
    : '';
  useEffect(() => {
    setDetailReady(false);
    setDetailError(false);
    const timer = setTimeout(() => setDetailImage(requestedDetail), 350);
    return () => clearTimeout(timer);
  }, [requestedDetail]);
  const effectiveSampling = Math.max(
    product === 'ndmi' ? Math.max(20, sampling) : sampling,
    ((bounds[2] - bounds[0]) * 111000) / 1600,
    ((bounds[3] - bounds[1]) * 111000) / 1600,
  );
  return (
    <div key={farm.id}>
      <FarmLibrary />
      {full && (
        <div
          className="detail-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Detailed satellite preview"
        >
          <div className="detail-preview-head">
            <strong>
              {farm.name} · {product} · {chosen?.date.slice(0, 10)}
            </strong>
            <label>
              Ground-window zoom
              <input
                aria-label="Detailed preview zoom"
                type="range"
                min={1}
                max={8}
                step={0.25}
                value={zoom}
                onChange={(e) => setZoom(+e.target.value)}
              />
              {zoom}×
            </label>
            <button className="button secondary" onClick={() => setFull(false)}>
              Close detailed preview
            </button>
          </div>
          <p>
            Sensor support: {product === 'ndmi' ? 20 : 10} m; no finer sensor detail is inferred.
            Click the image to recenter and request a smaller native-data crop. Window zoom fetches
            new source pixels; it does not create finer sensor resolution. Water/moisture indices
            are not soil-moisture observations.
          </p>
          <div className="detail-preview-scroll">
            <img
              key={detailImage}
              src={detailImage || undefined}
              alt="Detailed georeferenced satellite crop"
              onLoad={() => setDetailReady(true)}
              onError={() => {
                setDetailError(true);
                setDetailReady(true);
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setDetailCenter([
                  detailBounds[0] + ((e.clientX - r.left) / r.width) * dx,
                  detailBounds[3] - ((e.clientY - r.top) / r.height) * dy,
                ]);
                setZoom((z) => Math.min(8, z * 2));
              }}
              style={{
                width: '100%',
                maxWidth: 'none',
                imageRendering: crisp ? 'pixelated' : 'auto',
              }}
            />
            {!detailReady && <Busy text="Loading a new georeferenced detail window…" />}
            {detailError && (
              <Notice tone="warning">
                This detail window could not load. Choose another window, a coarser sampling
                setting, or another acquisition.
              </Notice>
            )}
          </div>
        </div>
      )}

      <Panel
        title="Selected farm · land inspection"
        eyebrow="YOUR BOUNDARY, OPENED SEPARATELY"
        action={
          <button
            className="button primary"
            onClick={() => {
              setInspect(true);
              setScene('');
              setFailed(false);
              setLoaded(false);
            }}
          >
            Fetch NSDI & latest Sentinel-2
          </button>
        }
      >
        <div className="form-grid">
          <label className="field">
            <span>Farm category</span>
            <input
              value={farm.category || 'Sri Lanka pilot'}
              maxLength={80}
              onChange={(e) => updateFarm({ category: e.target.value })}
            />
          </label>
          <div className="body-copy">
            {farm.boundary?.length
              ? `${farm.boundary.length} placed vertices define this field. Area is geodesically estimated, not cadastral.`
              : 'This sample is a point. Draw its perimeter in Earth Explorer to isolate the real farm area.'}
          </div>
        </div>
        <MapExplorer
          preview
          imageOverlay={inspect && chosen && mapOverlay ? { url: image, bounds } : undefined}
        />
        <Notice>
          Boundary isolation is a viewing tool. Regional soil polygons and satellite pixels are not
          field soil measurements. Retrieved NSDI attributes never silently overwrite farmer
          assumptions.
        </Notice>
      </Panel>
      {inspect && (
        <>
          <Panel
            title="Sri Lanka land context"
            eyebrow="NSDI AGRICULTURE · INTERSECTING REGIONAL MAP UNITS"
          >
            {context.loading ? (
              <Busy text="Querying soil, agro-ecology and water reference layers…" />
            ) : context.error ? (
              <Notice tone="error">{context.error}</Notice>
            ) : (
              context.data?.layers.map((l) => (
                <details className="land-record" key={l.id} open={l.id === 24 || l.id === 34}>
                  <summary>
                    {l.name} · {l.status} · {l.records.length} map units
                  </summary>
                  {l.records.map((r, i) => (
                    <dl className="receipt" key={i}>
                      {Object.entries(r).map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  ))}
                  {!l.records.length && (
                    <p className="body-copy">
                      No returned intersection, or service unavailable. No classification inferred.
                    </p>
                  )}
                  <LinkOut href={l.source}>Source metadata</LinkOut>
                </details>
              ))
            )}
            {context.data && (
              <p className="chart-note">
                {context.data.scope} Retrieved {context.data.retrieved_at}. Map publication dates
                were not verified.
              </p>
            )}
          </Panel>
          <Panel
            title="Free Sentinel-2 · native 10 m imagery"
            eyebrow="LATEST ACQUISITIONS, NOT CONTINUOUS VIDEO"
          >
            {sentinel.loading ? (
              <Busy text="Finding recent Sentinel-2 acquisitions…" />
            ) : sentinel.error ? (
              <Notice tone="error">{sentinel.error}</Notice>
            ) : chosen ? (
              <>
                <label className="field">
                  <span>Acquisition · tile-wide cloud coverage</span>
                  <select
                    aria-label="Sentinel acquisition"
                    value={chosen.id}
                    onChange={(e) => {
                      setScene(e.target.value);
                      setFailed(false);
                      setLoaded(false);
                    }}
                  >
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.date.slice(0, 10)} · {s.cloud?.toFixed(1)}% clouds · {s.id}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="body-copy">
                  {sentinel.data?.note} This is a separate cropped preview of the selected land.
                  Clouds can obscure the field; a newer image is not necessarily clearer.
                </p>
                <div className="satellite-controls">
                  <label className="field">
                    <span>Auto-selection</span>
                    <select
                      aria-label="Satellite scene preference"
                      value={preferClear ? 'clear' : 'latest'}
                      onChange={(e) => {
                        setPreferClear(e.target.value === 'clear');
                        setScene('');
                        setLoaded(false);
                        setFailed(false);
                      }}
                    >
                      <option value="clear">Clearest of recent scenes (tile estimate)</option>
                      <option value="latest">Newest acquisition</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Data highlight</span>
                    <select
                      aria-label="Satellite data highlight"
                      value={product}
                      onChange={(e) => {
                        setProduct(e.target.value);
                        setLoaded(false);
                        setFailed(false);
                      }}
                    >
                      <option value="truecolor">True color · 10 m source</option>
                      <option value="ndwi">Surface water signal · NDWI</option>
                      <option value="ndmi">Vegetation moisture signal · NDMI</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Preview sampling</span>
                    <select
                      aria-label="Satellite preview sampling"
                      value={sampling}
                      onChange={(e) => {
                        setSampling(+e.target.value);
                        setLoaded(false);
                        setFailed(false);
                      }}
                    >
                      <option value={10}>10 m · native visible/NIR</option>
                      <option value={20}>20 m · lighter preview</option>
                      <option value={60}>60 m · overview</option>
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={mapOverlay}
                      onChange={(e) => setMapOverlay(e.target.checked)}
                    />
                    Show this product on field map
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={crisp}
                      onChange={(e) => setCrisp(e.target.checked)}
                    />
                    Crisp native pixels
                  </label>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setFull(true);
                      setZoom(1);
                    }}
                  >
                    Open detailed preview ↗
                  </button>
                </div>
                <div className="spectral-legend">
                  <strong>
                    {product === 'truecolor'
                      ? 'True-color acquisition'
                      : product === 'ndwi'
                        ? 'NDWI · (green − NIR) / (green + NIR)'
                        : 'NDMI · (NIR − SWIR) / (NIR + SWIR)'}
                  </strong>
                  {product !== 'truecolor' && (
                    <>
                      <div className={product === 'ndwi' ? 'water-ramp' : 'moisture-ramp'} />
                      <span>−1 → 0 → +1 · dimensionless</span>
                      <p>
                        {product === 'ndwi'
                          ? 'Positive values can indicate surface water; vegetation, shadows and mixed pixels complicate interpretation.'
                          : 'Canopy/vegetation moisture response at 20 m native support; not measured soil moisture.'}{' '}
                        Cloud/shadow/snow pixels are masked using scene classification. These are
                        educational indicators, not a validated water or soil-condition diagnosis.
                      </p>
                    </>
                  )}
                  <small>
                    Effective sampling: {Math.round(effectiveSampling * 10) / 10} m (approximate),
                    capped at 1600 px per side. Large-area previews are coarser; open the detailed
                    preview and zoom its ground window to fetch a smaller native-data crop. Esri
                    remains on the map unless you enable this product.
                  </small>
                </div>
                <div className="sentinel-preview">
                  {!failed && (
                    <img
                      key={image}
                      src={image}
                      alt="Georeferenced Sentinel-2 true color crop at the selected field"
                      onLoad={() => setLoaded(true)}
                      onError={() => setFailed(true)}
                      style={
                        farm.boundary?.length
                          ? {
                              imageRendering: crisp ? 'pixelated' : 'auto',
                              clipPath: `polygon(${farm.boundary.map((p) => `${((p[0] - bounds[0]) / (bounds[2] - bounds[0])) * 100}% ${((bounds[3] - p[1]) / (bounds[3] - bounds[1])) * 100}%`).join(',')})`,
                            }
                          : { imageRendering: crisp ? 'pixelated' : 'auto' }
                      }
                    />
                  )}
                  {!loaded && !failed && (
                    <Busy text="Reading the native-resolution satellite crop…" />
                  )}
                </div>
                {failed && (
                  <Notice tone="warning">
                    The native crop could not be rendered. The scene and original 10 m asset remain
                    available below; choose another acquisition or retry.
                  </Notice>
                )}
                <div className="inline-actions">
                  <span className="badge">
                    Source resolution: {product === 'ndmi' ? 20 : chosen.resolution} m · preview
                    capped at 1600 pixels per side
                  </span>
                  <LinkOut href={chosen.visual}>Original georeferenced image (COG)</LinkOut>
                  <LinkOut href={chosen.source}>Scene provenance</LinkOut>
                </div>
              </>
            ) : (
              <Notice>No scenes found over this field.</Notice>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
