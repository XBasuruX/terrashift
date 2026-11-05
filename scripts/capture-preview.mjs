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

  // 1. Take desktop full screenshot
  const shot1 = path.join(artifactDir, 'xfarm-local-desktop.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved shot 1:', shot1);

  // 2. Click on the tractor machinery in the sidebar to open Fleet drawer
  try {
    const fleetBtn = await page.locator('button[title*="Machinery"]').first();
    if (await fleetBtn.isVisible()) {
      await fleetBtn.click();
      await page.waitForTimeout(600);
      const shot2 = path.join(artifactDir, 'xfarm-local-fleet.png');
      await page.screenshot({ path: shot2 });
      console.log('Saved shot 2:', shot2);

      // Close fleet drawer
      await fleetBtn.click();
      await page.waitForTimeout(400);
    }
  } catch (e) {
    console.log('Fleet shot error:', e.message);
  }

  // 3. Click Plot N2 to open Field Detail drawer
  try {
    const plotN2 = await page.locator('text=Plot N2').first();
    if (await plotN2.isVisible()) {
      await plotN2.click();
      await page.waitForTimeout(600);
      const shotDetail = path.join(artifactDir, 'xfarm-local-field-detail.png');
      await page.screenshot({ path: shotDetail });
      console.log('Saved shot detail:', shotDetail);

      // Close drawer with back arrow
      const backBtn = await page.locator('button[aria-label*="Back to fields"], button[aria-label*="Torna ai campi"]').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(400);
      }
    }
  } catch (e) {
    console.log('Field detail shot error:', e.message);
  }

  // 4. Click iPad tablet mode
  try {
    const ipadBtn = await page.locator('button[title*="iPad"]').first();
    if (await ipadBtn.isVisible()) {
      await ipadBtn.click();
      await page.waitForTimeout(600);
      const shot3 = path.join(artifactDir, 'xfarm-local-ipad.png');
      await page.screenshot({ path: shot3 });
      console.log('Saved shot 3:', shot3);
    }
  } catch (e) {
    console.log('iPad shot error:', e.message);
  }

  // 5. Click iPhone mobile mode
  try {
    const iphoneBtn = await page.locator('button[title*="iPhone"]').first();
    if (await iphoneBtn.isVisible()) {
      await iphoneBtn.click();
      await page.waitForTimeout(600);
      const shot4 = path.join(artifactDir, 'xfarm-local-iphone.png');
      await page.screenshot({ path: shot4 });
      console.log('Saved shot 4:', shot4);
    }
  } catch (e) {
    console.log('iPhone shot error:', e.message);
  }

  await browser.close();
  console.log('Done capturing screenshots!');
}

main().catch(console.error);
