import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('layer detail, opacity, vector legends and image clarity controls', async ({ page }) => {
  const vectors = await readFile('backend/fixtures/nsdi_clipped_preview.json', 'utf8');
  await page.route('**/api/land/vectors/24?**', (r) =>
    r.fulfill({ contentType: 'application/json', body: vectors }),
  );
  await page.goto('/');
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-ready', 'true');
  await page.getByRole('button', { name: 'Map detail & layers', exact: true }).click();
  await page.getByLabel('Map display quality').selectOption('fine');
  await page.getByLabel('Basemap tile zoom cap').selectOption('23');
  await page.getByRole('checkbox', { name: 'Soil classification', exact: true }).check();
  await expect(page.getByLabel('Soil classification detail')).toBeVisible();
  await page.getByLabel('Soil classification detail').selectOption('native');
  await expect(page.getByText(/3 features · native geometry/)).toBeVisible();
  await page.getByLabel('Soil classification opacity').fill('0.6');
  await expect(page.locator('.vector-legend')).not.toBeEmpty();
  await page.screenshot({ path: 'artifacts/map-detail-controls.png', fullPage: true });
});

test('satellite products keep basemap sharp and offer honest sampling and popout', async ({
  page,
}) => {
  const data = JSON.parse(await readFile('backend/fixtures/sentinel_search.json', 'utf8'));
  await page.route('**/api/land/context', (r) =>
    r.fulfill({ json: { layers: [], retrieved_at: '2026-10-31', scope: 'Regional reference' } }),
  );
  await page.route('**/api/land/sentinel', (r) =>
    r.fulfill({
      json: {
        scenes: data.features.map((f: any) => ({
          id: f.id,
          date: f.properties.datetime,
          cloud: f.properties['eo:cloud_cover'],
          resolution: 10,
          visual: f.assets.visual.href,
          source:
            f.links?.find((l: any) => l.rel === 'self')?.href ||
            'https://earth-search.aws.element84.com',
        })),
        bbox: [80.39, 8.3, 80.42, 8.33],
        note: 'Actual archived scene metadata',
      },
    }),
  );
  await page.route('**/api/land/sentinel/image?**', async (r) =>
    r.fulfill({ contentType: 'image/png', body: await readFile('artifacts/sentinel-field.png') }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'My Farm 03', exact: true }).click();
  await page.getByRole('button', { name: 'Fetch NSDI & latest Sentinel-2', exact: true }).click();
  await expect(page.getByLabel('Satellite data highlight')).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Show this product on field map' }),
  ).not.toBeChecked();
  await page.getByLabel('Satellite data highlight').selectOption('ndmi');
  await expect(page.getByText(/Effective sampling: 20 m/)).toBeVisible();
  await page.getByLabel('Satellite preview sampling').selectOption('60');
  await expect(page.getByText(/Effective sampling: 60 m/)).toBeVisible();
  await page.getByRole('button', { name: 'Open detailed preview ↗', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Detailed satellite preview' })).toBeVisible();
  await expect(page.getByAltText('Detailed georeferenced satellite crop')).toHaveAttribute(
    'src',
    /bbox=/,
  );
  const oldSource = await page
    .getByAltText('Detailed georeferenced satellite crop')
    .getAttribute('src');
  await page.getByLabel('Detailed preview zoom').fill('3');
  await expect
    .poll(() => page.getByAltText('Detailed georeferenced satellite crop').getAttribute('src'))
    .not.toBe(oldSource);
  await page.getByRole('button', { name: 'Close detailed preview', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
