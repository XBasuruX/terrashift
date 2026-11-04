import { mkdirSync, cpSync } from 'node:fs';
mkdirSync('public/vendor/cesium', { recursive: true });
for (const name of ['Assets', 'Widgets', 'Workers', 'ThirdParty', 'Cesium.js'])
  cpSync(`node_modules/cesium/Build/Cesium/${name}`, `public/vendor/cesium/${name}`, {
    recursive: true,
  });
console.log('CesiumJS runtime prepared locally.');
