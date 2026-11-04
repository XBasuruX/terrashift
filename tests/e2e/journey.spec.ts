import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('NASA cache → farm → rotations → stress → evidence → brief', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('CACHED NASA OBSERVATIONS', { exact: true })).toBeVisible();
  await expect(page.locator('.map-card')).toHaveAttribute('data-map-ready', 'true');
  await page.screenshot({ path: 'test-results/overview.png', fullPage: true });
  await expect(
    page.getByRole('heading', { name: 'Every season starts with understanding.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'My Farm 03', exact: true }).click();
  await page.getByLabel('Farm name', { exact: true }).fill('Team six learning farm');
  await page.getByLabel('Irrigation allocation').fill('20');
  await page.getByRole('button', { name: 'Compare my rotations' }).click();
  await expect(page.locator('.rotation-card')).toHaveCount(3);
  await expect(
    page.getByRole('heading', { name: 'Water-lean alternative', exact: true }),
  ).toBeVisible();
  const before = await page.locator('.rotation-card').first().locator('.score strong').innerText();
  await page.getByLabel('Rotation diversity priority').fill('90');
  await expect
    .poll(async () => page.locator('.rotation-card').first().locator('.score strong').innerText())
    .not.toBe(before);
  await page.getByRole('button', { name: 'Inspect Priority-led alternative', exact: true }).click();
  await expect(page.getByText('Why this result?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit sequence', exact: true }).first().click();
  await page.getByLabel('Alternative 1, season 1', { exact: true }).selectOption('mungbean');
  await page.getByRole('button', { name: 'Recompute both alternatives' }).click();
  await expect(page.getByText('Showing your edited alternatives.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare decision brief' }).click();
  await expect(page.locator('.decision-document')).toContainText('Team six learning farm');
  await expect(page.getByTestId('selected-strategy-brief')).toContainText('Mung bean →');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('terrashift-decision-brief.json');
  const exported = JSON.parse(await readFile((await file.path())!, 'utf8'));
  expect(
    exported.rotations.find((r: { id: string }) => r.id === exported.selected_rotation).sequence[0],
  ).toBe('mungbean');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.pdf({ path: 'test-results/decision-brief.pdf', format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Climate Lab 05', exact: true }).click();
  await expect(page.getByText('cached · 14 accepted composites', { exact: true })).toBeVisible();
  await expect(page.locator('.scenario-results')).toBeVisible();
  const normal = await page.locator('.scenario-number').first().innerText();
  await page.getByLabel('Temperature shift', { exact: true }).fill('6');
  await page.getByLabel('Rainfall change', { exact: true }).fill('0.2');
  await expect
    .poll(async () => page.locator('.scenario-number').first().innerText())
    .not.toBe(normal);
  await page.getByLabel('Climate replay scenario').selectOption('dry');
  await expect(page.getByText(/Historical replay year:/)).toBeVisible();
  await page.getByRole('button', { name: 'Evidence & Sources 06', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your environmental data receipt' }),
  ).toBeVisible();
  await expect(page.locator('.receipt')).toContainText('NASA POWER');
  await page.getByRole('button', { name: 'Enable learning mode' }).click();
  await expect(page.locator('.learning-inspector')).toContainText('backend/science');
  await page.reload();
  await page.getByRole('button', { name: 'My Farm 03', exact: true }).click();
  await expect(page.getByLabel('Farm name', { exact: true })).toHaveValue('Team six learning farm');
  expect(errors).toEqual([]);
});

test('corrupt browser state restores a valid sample without crashing', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'terrashift-v1',
      JSON.stringify({ farm: { name: 9, latitude: 8, longitude: 80 } }),
    ),
  );
  await page.goto('/');
  await expect(
    page.getByText('Saved configuration was invalid. The sample farm was restored.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('CACHED NASA OBSERVATIONS', { exact: true })).toBeVisible();
});

test('location changes expose explicit simulation fallback and guided tour works', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Choose sample farm').selectOption('Nakuru, Kenya');
  await expect(page.getByText('SIMULATED WEATHER', { exact: true })).toBeVisible();
  await expect(page.getByText(/No genuine cache matches/)).toBeVisible();
  await page.getByRole('button', { name: 'Take a guided tour', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Next stop', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Find your place', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close tour', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile navigation and form layout fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'My Farm 03', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your land. Your constraints. Your priorities.' }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({ path: 'test-results/mobile-farm.png', fullPage: true });
});
