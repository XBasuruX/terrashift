import { test, expect } from '@playwright/test';
test('draw a farm, isolate it, switch independent fields and persist', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-ready', 'true');
  await page.getByRole('button', { name: 'Draw a new farm', exact: true }).click();
  const canvas = page.locator('.cesium-widget canvas');
  const b = (await canvas.boundingBox())!;
  for (const [x, y] of [
    [0.55, 0.48],
    [0.59, 0.48],
    [0.59, 0.54],
    [0.55, 0.54],
  ])
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  await expect(page.getByText(/New farm boundary · 4 points/)).toBeVisible();
  await page.getByRole('button', { name: 'Save farm area', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Selected farm · land inspection' }),
  ).toBeVisible();
  await expect(page.locator('.farm-entity')).toHaveCount(2);
  await page.getByLabel('Farm name', { exact: true }).fill('North field');
  await page.getByLabel('Irrigation allocation').fill('35');
  await page.locator('.farm-entity').filter({ hasText: 'Anuradhapura learning farm' }).click();
  await expect(page.getByLabel('Irrigation allocation')).toHaveValue('80');
  await page.locator('.farm-entity').filter({ hasText: 'North field' }).click();
  await expect(page.getByLabel('Irrigation allocation')).toHaveValue('35');
  await expect(page.locator('.farm-isolated')).toHaveAttribute('data-map-ready', 'true');
  await page.screenshot({ path: 'artifacts/cesium-farms.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'My Farm 03', exact: true }).click();
  await expect(page.locator('.farm-entity')).toHaveCount(2);
  await expect(page.getByLabel('Farm name', { exact: true })).toHaveValue('North field');
});
