import { chromium } from '@playwright/test';
import path from 'path';

async function main() {
  const artifactDir = 'C:\\Users\\dhamn\\.gemini\\antigravity\\brain\\97427297-7445-4b64-8937-1fc87255169a';
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.log('Trying system chrome channel...');
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:3000 ...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Take TerraShift Overview home view screenshot
  const shotOverview = path.join(artifactDir, 'terrashift-overview.png');
  await page.screenshot({ path: shotOverview });
  console.log('Saved shot 1 (Overview):', shotOverview);

  // 2. Click "Field Operations & Parcels" in the TerraShift sidebar
  try {
    const opNav = await page.locator('nav button:has-text("Field Operations"), nav button:has-text("Operations")').first();
    if (await opNav.isVisible()) {
      await opNav.click();
      await page.waitForTimeout(1000);
      const shotSat = path.join(artifactDir, 'terrashift-field-operations-satellite.png');
      await page.screenshot({ path: shotSat });
      console.log('Saved shot 2 (Field Operations - Satellite HD):', shotSat);
    }
  } catch (e) {
    console.log('Nav to operations error:', e.message);
  }

  // 3. Switch to Snazzy Maps layer
  try {
    const snazzyBtn = await page.locator('button:has-text("Snazzy Maps")').first();
    if (await snazzyBtn.isVisible()) {
      await snazzyBtn.click();
      await page.waitForTimeout(800);
      const shotSnazzy = path.join(artifactDir, 'terrashift-field-operations-snazzy.png');
      await page.screenshot({ path: shotSnazzy });
      console.log('Saved shot 3 (Field Operations - Snazzy Maps):', shotSnazzy);
    }
  } catch (e) {
    console.log('Snazzy button error:', e.message);
  }

  // 4. Switch to Hybrid layer
  try {
    const hybridBtn = await page.locator('button:has-text("Hybrid")').first();
    if (await hybridBtn.isVisible()) {
      await hybridBtn.click();
      await page.waitForTimeout(800);
      const shotHybrid = path.join(artifactDir, 'terrashift-field-operations-hybrid.png');
      await page.screenshot({ path: shotHybrid });
      console.log('Saved shot 4 (Field Operations - Hybrid):', shotHybrid);
    }
  } catch (e) {
    console.log('Hybrid button error:', e.message);
  }

  // 5. Click Plot N2 to determine the land area and display the detailed preview
  try {
    const plotN2 = await page.locator('text=Plot N2').first();
    if (await plotN2.isVisible()) {
      await plotN2.click();
      await page.waitForTimeout(800);
      const shotLandArea = path.join(artifactDir, 'terrashift-land-area-preview.png');
      await page.screenshot({ path: shotLandArea });
      console.log('Saved shot 5 (Detailed Land Area Preview):', shotLandArea);
    }
  } catch (e) {
    console.log('Click Plot N2 error:', e.message);
  }

  await browser.close();
  console.log('Done capturing all preview screenshots!');
}

main().catch(console.error);
