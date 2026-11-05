import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/tilemap/**', (route) => {
    const level = Number(route.request().url().split('/tilemap/')[1].split('/')[0]);
    return route.fulfill({ json: { valid: true, data: [level <= 18 ? 1 : 0] } });
  });
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
const cameraHeight = (page: Page) =>
  page.evaluate(() => (window as any).mapTestWidget.camera.positionCartographic.height);
async function extreme(page: Page, end: 'min' | 'max') {
  const slider = page.getByRole('slider', { name: 'Map zoom level', exact: true });
  await slider.fill((await slider.getAttribute(end))!);
}

for (const screen of ['Overview', 'Earth Explorer']) {
  test(`${screen}: numeric slider and wheel preserve deep zoom and enforce imagery limits`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    if (screen === 'Earth Explorer')
      await page.getByRole('button', { name: 'Earth Explorer 02', exact: true }).click();
    const map = page.locator('.cesium-map');
    const slider = page.getByRole('slider', { name: 'Map zoom level', exact: true });
    await expect(map).toHaveAttribute('data-map-ready', 'true');
    await expect.poll(() => cameraHeight(page)).toBeLessThan(14_100);
    await expect(page.getByText('Level 18', { exact: true })).toBeVisible();
    await expect(slider).toHaveAttribute('max', '20');
    await extreme(page, 'max');
    await expect.poll(() => cameraHeight(page)).toBeLessThan(200);
    await expect(page.getByRole('button', { name: 'Zoom in one stage' })).toBeDisabled();
    await expect(page.getByText('Maximum zoom reached')).toBeVisible();
    const minimum = Number(await map.getAttribute('data-map-min-height'));
    await map.locator('canvas').hover({ position: { x: 200, y: 200 } });
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -2500);
    await expect.poll(() => cameraHeight(page)).toBeGreaterThanOrEqual(minimum - 1);
    await expect(slider).toHaveValue('20');
    await page.mouse.wheel(0, 700);
    await expect.poll(() => cameraHeight(page)).toBeGreaterThan(minimum * 1.5);
    await expect(slider).not.toHaveValue('20');
    await extreme(page, 'min');
    await expect(page.getByRole('button', { name: 'Zoom out one stage' })).toBeDisabled();
    await map.locator('canvas').hover({ position: { x: 200, y: 200 } });
    await page.mouse.wheel(0, 10000);
    await expect.poll(() => cameraHeight(page)).toBeLessThanOrEqual(20_000_001);
    await extreme(page, 'max');
    await page.getByRole('button', { name: 'Map detail & layers', exact: true }).click();
    await page.getByLabel('Basemap tile zoom cap').selectOption('17');
    await expect(
      page.locator('.map-zoom-facts').getByText('Level 17', { exact: true }),
    ).toBeVisible();
    await expect.poll(() => cameraHeight(page)).toBeGreaterThan(minimum * 1.8);
    await page.getByRole('button', { name: '1 m/px view', exact: true }).click();
    await expect
      .poll(() => cameraHeight(page))
      .toBeGreaterThanOrEqual(Number(await map.getAttribute('data-map-min-height')) - 1);
    await expect(map).not.toHaveAttribute('data-map-render-state', 'failed');
    expect(errors).toEqual([]);
  });
}

test('availability follows the location globally and keeps deeper imagery accessible', async ({
  page,
}) => {
  let available = 18;
  await page.route('**/tilemap/**', (route) => {
    const level = Number(route.request().url().split('/tilemap/')[1].split('/')[0]);
    return route.fulfill({ json: { valid: true, data: [level <= available ? 1 : 0] } });
  });
  await page.goto('/');
  await expect(page.getByText('Level 18', { exact: true })).toBeVisible({ timeout: 15000 });
  available = 21;
  await page.getByLabel('Choose sample farm').selectOption('Fresno, California');
  await expect(page.locator('.map-zoom-facts').getByText('Level 21', { exact: true })).toBeVisible({
    timeout: 15000,
  });
  const slider = page.getByRole('slider', { name: 'Map zoom level', exact: true });
  await expect(slider).toHaveAttribute('max', '23');
  await extreme(page, 'max');
  await expect.poll(() => cameraHeight(page)).toBeLessThan(30);
  await expect(page.locator('.map-zoom-control')).not.toContainText(/Country|Region|Town/);
});

test('2D also enforces the zoom limit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Level 18', { exact: true })).toBeVisible();
  await extreme(page, 'max');
  await page.evaluate(() => (window as any).mapTestWidget.scene.morphTo2D(0));
  await extreme(page, 'max');
  await page.locator('.cesium-map canvas').hover({ position: { x: 200, y: 200 } });
  await page.mouse.wheel(0, -10000);
  await expect
    .poll(async () => cameraHeight(page))
    .toBeGreaterThanOrEqual(
      Number(await page.locator('.cesium-map').getAttribute('data-map-min-height')) - 1,
    );
  await expect(page.locator('.cesium-map')).not.toHaveAttribute('data-map-render-state', 'failed');
});
