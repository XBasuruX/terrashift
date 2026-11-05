import type * as Cesium from 'cesium';

// Keep the full provider range. Local tile availability determines the camera
// limit; the service-wide maximum is not a guarantee of coverage everywhere.
export const BASEMAP_MAX_LEVEL = 23;
export const WORLD_HEIGHT = 20_000_000;
export const DETAIL_HEIGHT = 5;

export type ImageryCoverage = { level: number | null; latitude: number; verified: boolean };

/** Query the provider's actual coverage at the view center, not its advertised LODs. */
export function installImageryCoverage(
  v: Cesium.Viewer,
  C: typeof Cesium,
  url: string,
  cap: number,
  onCoverage: (coverage: ImageryCoverage) => void,
) {
  let disposed = false;
  let timer: ReturnType<typeof setTimeout>;
  let request: AbortController | undefined;
  const cached = new Map<string, ImageryCoverage>();
  let lastCoverage: ImageryCoverage | undefined;
  const currentMosaic =
    /(?:server\.arcgisonline\.com|clarity\.maptiles\.arcgis\.com)\/arcgis\/rest\/services\/World_Imagery\/MapServer\/tile\//i.test(
      url,
    );
  const root = url.split('/tile/')[0];
  const check = () => {
    clearTimeout(timer);
    request?.abort();
    timer = setTimeout(async () => {
      if (disposed || v.isDestroyed() || v.scene.mode === C.SceneMode.MORPHING) return;
      const hit = v.camera.pickEllipsoid(
        new C.Cartesian2(v.canvas.clientWidth / 2, v.canvas.clientHeight / 2),
      );
      const position = hit ? C.Cartographic.fromCartesian(hit) : v.camera.positionCartographic;
      const latitude = C.Math.clamp(position.latitude, -1.4844, 1.4844);
      const longitude = position.longitude;
      // Reuse a result while zooming within the same high-detail tile.
      const tile = (z: number) => ({
        x: Math.floor(((longitude + Math.PI) / (2 * Math.PI)) * 2 ** z),
        y: Math.floor(((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2) * 2 ** z),
      });
      const keyTile = tile(cap);
      const key = `${keyTile.x}/${keyTile.y}`;
      const known = cached.get(key);
      if (known) {
        lastCoverage = known;
        onCoverage(known);
        return;
      }
      onCoverage({ level: lastCoverage?.level ?? null, latitude, verified: false });
      if (!currentMosaic) {
        onCoverage({ level: null, latitude, verified: false });
        return;
      }
      const controller = new AbortController();
      request = controller;
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        let low = 0,
          high = cap,
          available = -1;
        while (low <= high) {
          const z = Math.floor((low + high) / 2);
          const { x, y } = tile(z);
          const response = await fetch(`${root}/tilemap/${z}/${y}/${x}/1/1?f=json`, {
            signal: controller.signal,
          });
          if (!response.ok) throw Error('Coverage unavailable');
          const data = await response.json();
          if (!data.valid || ![0, 1].includes(data.data?.[0])) throw Error('Coverage unavailable');
          if (data.data[0] === 1) {
            available = z;
            low = z + 1;
          } else high = z - 1;
        }
        if (available < 0) throw Error('Coverage unavailable');
        if (!disposed && !controller.signal.aborted) {
          lastCoverage = { level: available, latitude, verified: true };
          if (cached.size >= 64) cached.clear();
          cached.set(key, lastCoverage);
          onCoverage(lastCoverage);
        }
      } catch {
        if (!disposed && !controller.signal.aborted)
          onCoverage({ level: null, latitude, verified: false });
      } finally {
        clearTimeout(timeout);
      }
    }, 250);
  };
  const remove = v.camera.moveEnd.addEventListener(check);
  check();
  return () => {
    disposed = true;
    clearTimeout(timer);
    request?.abort();
    remove();
  };
}

export function viewMetersPerPixel(v: Cesium.Viewer, C: typeof Cesium) {
  const frustum = v.camera.frustum;
  if (v.scene.mode === C.SceneMode.SCENE2D && 'right' in frustum && 'left' in frustum)
    return ((frustum.right ?? 0) - (frustum.left ?? 0)) / Math.max(1, v.canvas.clientWidth);
  const fovy = ('fovy' in frustum ? frustum.fovy : undefined) ?? Math.PI / 3;
  return (
    (2 * Math.tan(fovy / 2) * v.camera.positionCartographic.height) /
    Math.max(1, v.canvas.clientHeight)
  );
}

export function imageryZoomMinimum(
  v: Cesium.Viewer,
  C: typeof Cesium,
  level: number,
  latitude: number,
) {
  const sourceMpp = (156543.033928 * Math.cos(latitude)) / 2 ** level;
  // Permit 4× inspection of the finest available image for boundary placement.
  // Magnification is explicitly labeled; it does not add source detail.
  const pixelHeight =
    v.scene.mode === C.SceneMode.SCENE2D
      ? v.canvas.clientWidth
      : v.canvas.clientHeight /
        (2 *
          Math.tan(
            (('fovy' in v.camera.frustum ? v.camera.frustum.fovy : undefined) ?? Math.PI / 3) / 2,
          ));
  return Math.max(DETAIL_HEIGHT, (sourceMpp * pixelHeight) / 4);
}

export function setMapHeight(v: Cesium.Viewer, C: typeof Cesium, height: number) {
  const center = v.camera.pickEllipsoid(
    new C.Cartesian2(v.canvas.clientWidth / 2, v.canvas.clientHeight / 2),
    v.scene.globe.ellipsoid,
  );
  const position = center ? C.Cartographic.fromCartesian(center) : v.camera.positionCartographic;
  v.camera.cancelFlight();
  v.camera.setView({
    destination: C.Cartesian3.fromRadians(
      position.longitude,
      position.latitude,
      C.Math.clamp(height, v.scene.screenSpaceCameraController.minimumZoomDistance, WORLD_HEIGHT),
    ),
    orientation: { heading: v.camera.heading, pitch: -Math.PI / 2, roll: 0 },
  });
  v.scene.requestRender();
}

export function installZoomLimits(
  v: Cesium.Viewer,
  C: typeof Cesium,
  minimum: number,
  onChange: (height: number) => void,
) {
  const controller = v.scene.screenSpaceCameraController;
  controller.minimumZoomDistance = minimum;
  controller.maximumZoomDistance = WORLD_HEIGHT;
  controller.enableCollisionDetection = true;
  controller.inertiaZoom = 0;
  let lastHeight = -1;
  // Cesium's native limits cover wheel/pinch. Also constrain flyTo, layer
  // presets, boundary fitting and scene-mode changes before rendering a frame.
  const remove = v.scene.postUpdate.addEventListener(() => {
    if (v.scene.mode === C.SceneMode.MORPHING) return;
    let height = v.camera.positionCartographic.height;
    if (!Number.isFinite(height)) return;
    const clamped = C.Math.clamp(height, minimum, WORLD_HEIGHT);
    if (Math.abs(height - clamped) > 0.5) {
      const p = v.camera.positionCartographic;
      v.camera.cancelFlight();
      v.camera.setView({
        destination: C.Cartesian3.fromRadians(p.longitude, p.latitude, clamped),
        orientation: { heading: v.camera.heading, pitch: v.camera.pitch, roll: v.camera.roll },
      });
      height = clamped;
    }
    if (Math.abs(height - lastHeight) >= 1) {
      lastHeight = height;
      onChange(height);
    }
  });
  v.scene.requestRender();
  return remove;
}

export function satelliteProvider(C: typeof Cesium, url: string, maximumLevel: number) {
  return new C.UrlTemplateImageryProvider({
    url,
    maximumLevel,
    credit: 'Esri, Maxar, Earthstar Geographics · dates and detail vary',
    // Same missing-tile detection used by Cesium's ArcGIS provider. Retain
    // available parent imagery instead of painting unavailable-data tiles.
    tileDiscardPolicy: new C.DiscardMissingTileImagePolicy({
      missingImageUrl: url.replace('{z}', '23').replace('{y}', '0').replace('{x}', '0'),
      pixelsToCheck: [
        new C.Cartesian2(0, 0),
        new C.Cartesian2(200, 20),
        new C.Cartesian2(20, 200),
        new C.Cartesian2(80, 110),
        new C.Cartesian2(160, 130),
      ],
      disableCheckIfAllPixelsAreTransparent: true,
    }),
  });
}
