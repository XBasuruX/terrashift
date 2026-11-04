import type * as Cesium from 'cesium';

export type RenderState = 'ready' | 'recovering' | 'recovered' | 'failed';

/** Public Cesium APIs only: reset the flat terrain cache, not the user's map data. */
export function installRenderRecovery(
  viewer: Cesium.Viewer,
  C: typeof Cesium,
  onState: (state: RenderState) => void,
) {
  // Load intermediate terrain levels before descendants. This avoids mixing many
  // provisional fill meshes during fast zooms/layer changes on the flat globe.
  viewer.scene.globe.loadingDescendantLimit = 0;
  viewer.scene.globe.tileCacheSize = 512;
  let disposed = false;
  let automaticAttempted = false;
  let waitingForFrame = false;
  let restartTimer: ReturnType<typeof setTimeout> | undefined;
  let frameTimer: ReturnType<typeof setTimeout> | undefined;
  function clearTimers() {
    clearTimeout(restartTimer);
    clearTimeout(frameTimer);
  }
  function restart() {
    if (disposed || viewer.isDestroyed()) return;
    clearTimers();
    waitingForFrame = false;
    onState('recovering');
    // Cesium stops its loop after raising renderError. Resume on the next task,
    // after that handler has finished; resuming synchronously gets overwritten.
    restartTimer = setTimeout(() => {
      if (disposed || viewer.isDestroyed()) return;
      try {
        viewer.terrainProvider = new C.EllipsoidTerrainProvider({
          ellipsoid: viewer.scene.globe.ellipsoid,
        });
        waitingForFrame = true;
        frameTimer = setTimeout(() => {
          if (!waitingForFrame || disposed || viewer.isDestroyed()) return;
          waitingForFrame = false;
          viewer.useDefaultRenderLoop = false;
          onState('failed');
        }, 5000);
        viewer.useDefaultRenderLoop = true;
        viewer.scene.requestRender();
      } catch (error) {
        waitingForFrame = false;
        clearTimers();
        console.warn('TerraShift map recovery failed', error);
        onState('failed');
      }
    }, 0);
  }
  const removeError = viewer.scene.renderError.addEventListener(
    (_scene: Cesium.Scene, error: Error) => {
      clearTimers();
      waitingForFrame = false;
      console.warn('TerraShift map renderer reported an error', error);
      const terrainFillFailure = /(?:south|north|east|west)Indices|TerrainFillMesh/.test(
        `${error?.message || error} ${error?.stack || ''}`,
      );
      if (terrainFillFailure && !automaticAttempted) {
        automaticAttempted = true;
        restart();
      } else {
        onState('failed');
      }
    },
  );
  const removeFrame = viewer.scene.postRender.addEventListener(() => {
    if (!waitingForFrame || disposed) return;
    waitingForFrame = false;
    clearTimers();
    onState('recovered');
  });
  return {
    restart,
    dispose() {
      disposed = true;
      clearTimers();
      removeError();
      removeFrame();
    },
  };
}
