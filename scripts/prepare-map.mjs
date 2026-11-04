import { mkdirSync, cpSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

try {
  const destDir = resolve(process.cwd(), 'public/vendor/cesium');
  mkdirSync(destDir, { recursive: true });

  const srcDir = resolve(process.cwd(), 'node_modules/cesium/Build/Cesium');
  if (existsSync(srcDir)) {
    for (const name of ['Assets', 'Widgets', 'Workers', 'ThirdParty', 'Cesium.js']) {
      const srcPath = join(srcDir, name);
      const destPath = join(destDir, name);
      if (existsSync(srcPath)) {
        cpSync(srcPath, destPath, { recursive: true });
      }
    }
    console.log('CesiumJS runtime prepared successfully.');
  } else {
    console.log('Cesium Build directory not found, skipping copy.');
  }
} catch (err) {
  console.warn('Warning during prepare-map.mjs:', err);
}
