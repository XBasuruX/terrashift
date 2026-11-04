import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Capture the real widget in the test harness without exposing it in application code.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    let engine: any;
    Object.defineProperty(w, 'Cesium', {
      configurable: true,
      get: () => engine,
      set: (value) => {
        engine = value;
        const render = value.CesiumWidget.prototype.render;
        value.CesiumWidget.prototype.render = function () {
          w.mapTestWidget = this;
          return render.call(this);
        };
      },
    });
  });
});

test('terrain-fill failure recovers once, preserves layers, and repeated failure is actionable', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-ready', 'true');
  await expect.poll(() => page.evaluate(() => !!(window as any).mapTestWidget)).toBe(true);
  await page.getByRole('button', { name: 'Map detail & layers', exact: true }).click();
  await page.getByLabel('Basemap tile zoom cap').selectOption('23');
  const fail = () =>
    page.evaluate(() => {
      const widget = (window as any).mapTestWidget;
      // Fail inside a real render pass so Cesium itself stops its default loop.
      let thrown = false;
      widget.scene.primitives.add({
        update() {
          if (thrown) return;
          thrown = true;
          throw new TypeError(
            "Cannot read properties of undefined (reading 'southIndicesEastToWest')",
          );
        },
        isDestroyed: () => false,
        destroy() {},
      });
      widget.scene.requestRender();
    });
  await fail();
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-render-state', 'recovered');
  await expect(page.getByText(/Map recovered after a terrain-tile error/)).toBeVisible();
  await expect(page.getByLabel('Basemap tile zoom cap')).toHaveValue('23');
  await expect
    .poll(() => page.evaluate(() => (window as any).mapTestWidget.useDefaultRenderLoop))
    .toBe(true);
  await fail();
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-render-state', 'failed');
  await page.getByRole('button', { name: 'Restart map rendering', exact: true }).click();
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-render-state', 'recovered');
  await page.getByRole('button', { name: '20 m/px view', exact: true }).click();
  await expect(page.locator('.map-card')).not.toHaveAttribute('data-map-render-state', 'failed');
});

test('rapid quality, zoom, archive and overlay changes keep the render loop running', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      /error|warning/.test(m.type()) &&
      /rendering|Indices|TerrainFillMesh|map renderer/i.test(m.text())
    )
      errors.push(m.text());
  });
  const archives = JSON.parse(await readFile('backend/fixtures/wayback_config.json', 'utf8'));
  const archive = Object.values(archives)[0] as { itemURL: string };
  await page.route('**/api/land/imagery-options', (r) =>
    r.fulfill({
      json: {
        mode: 'cached',
        options: [
          {
            id: 'archive',
            name: 'Actual archived Esri source',
            url: archive.itemURL
              .replace('{level}', '{z}')
              .replace('{row}', '{y}')
              .replace('{col}', '{x}'),
          },
        ],
      },
    }),
  );
  await page.goto('/');
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-ready', 'true');
  await page.getByRole('button', { name: 'Map detail & layers', exact: true }).click();
  for (const quality of ['fine', 'fast', 'balanced', 'fine']) {
    await page.getByLabel('Map display quality').selectOption(quality);
    await page.getByLabel('Basemap tile zoom cap').selectOption(quality === 'fine' ? '23' : '17');
    await page
      .getByLabel('Basemap imagery source')
      .selectOption(quality === 'fine' ? 'archive' : 'current');
    await page
      .getByRole('button', {
        name: quality === 'fast' ? '20 m/px view' : '1 m/px view',
        exact: true,
      })
      .click();
    await page.getByRole('button', { name: 'Water highlights', exact: true }).click();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
  }
  await expect
    .poll(() => page.evaluate(() => (window as any).mapTestWidget?.useDefaultRenderLoop))
    .toBe(true);
  expect(errors).toEqual([]);
});
