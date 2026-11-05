import { expect, test } from '@playwright/test';

test.use({ baseURL: process.env.XFARM_TEST_URL ?? 'http://127.0.0.1:3000' });

test('fields, activities and drawn boundaries survive a reload', async ({ page }) => {
  const external: string[] = [];
  let checkingFieldOperations = false;
  await page.route(/^https?:\/\//, (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') return route.continue();
    if (checkingFieldOperations) external.push(hostname);
    return route.abort();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Manage fields' }).click();
  await page.getByLabel('Field book', { exact: true }).selectOption('cuneo');
  checkingFieldOperations = true;
  await page.getByTitle('Field book language').click();
  await expect(page.getByRole('heading', { name: 'I tuoi campi' })).toBeVisible();
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  await expect(page.locator('.parcel-list').first()).toBeVisible();
  await page.getByRole('button', { name: 'Grana OVEST', exact: true }).click();
  await page.getByRole('button', { name: 'Registra attività' }).click();
  await page.getByRole('button', { name: 'Save Activity' }).click();
  await expect(page.locator('.xfarm-activity-item').first()).toContainText('Defending');
  await page.getByRole('button', { name: 'Torna ai campi' }).click();
  await page.getByRole('button', { name: 'Azioni campi' }).click();
  await page.getByRole('button', { name: 'Nuovo Campo' }).click();
  const map = page.locator('.parcel-canvas');
  await map.click({ position: { x: 250, y: 240 } });
  await map.click({ position: { x: 470, y: 240 } });
  await expect(page.getByRole('button', { name: 'Avanti' })).toBeDisabled();
  await map.click({ position: { x: 400, y: 395 } });
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.locator('.xfarm-modal-backdrop input').first().fill('Boundary test');
  await page.getByRole('button', { name: 'Save Field' }).click();
  await expect(page.locator('.parcel-map-name')).toHaveText('Boundary test');
  checkingFieldOperations = false;
  await page.reload();
  await page.getByRole('button', { name: 'Manage fields' }).click();
  await page.getByLabel('Field book', { exact: true }).selectOption('cuneo');
  await page.getByTitle('Field book language').click();
  await page.getByRole('button', { name: 'Boundary test', exact: true }).click();
  await page.getByRole('button', { name: 'Files', exact: true }).click();
  await expect(page.getByText('3 vertici · WGS84')).toBeVisible();
  expect(external).toEqual([]);
});

test('phone navigation imports a local GeoJSON field', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Manage fields' }).click();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.getByRole('button', { name: 'Import from file' }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'local.geojson',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [7.5, 44.4],
            [7.501, 44.4],
            [7.501, 44.401],
            [7.5, 44.4],
          ],
        ],
      }),
    ),
  });
  await expect(page.locator('.parcel-map-name')).toHaveText('local');
  await expect(page.locator('.parcel-metadata')).toContainText('Imported');
});

test('TerraShift navigation shares parcel records with the planning workspace', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Every season starts with understanding.'})).toBeVisible();
  await page.getByRole('button',{name:'Manage fields'}).click();
  await page.getByLabel('Field book',{exact:true}).selectOption('cuneo');
  await page.getByRole('button',{name:'Grana OVEST',exact:true}).click();
  await page.getByRole('button',{name:'Register activity',exact:true}).click();
  await page.getByRole('button',{name:'Save Activity'}).click();
  await page.getByRole('button',{name:'Rotation studio →',exact:true}).click();
  await expect(page.locator('.rotation-card')).toHaveCount(3);
  await page.getByRole('button',{name:'My Farm 03'}).click();
  await expect(page.getByLabel('Farm name',{exact:true})).toHaveValue('Grana OVEST');
  await page.getByRole('button',{name:'Open field operations'}).click();
  await expect(page.locator('.parcel-map-name')).toHaveText('Grana OVEST');
  await expect(page.locator('.xfarm-activity-item').first()).toContainText('Defending');
  await page.reload();
  await page.getByRole('button',{name:'Manage fields'}).click();
  await expect(page.locator('.parcel-map-name')).toHaveText('Grana OVEST');
  await expect(page.locator('.xfarm-activity-item').first()).toContainText('Defending');
});
