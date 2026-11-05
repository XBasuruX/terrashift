import { fieldGeometry } from '@/lib/geometry';
import type { XFarmField } from './xfarmData';

export type Point = [number, number];
export const aerialImage = '/data/cuneo-ortho.webp';
// The local orthophoto covers XYZ columns 34130–34143 and rows 23726–23733 at zoom 16.
export function toMap([lat, lon]: Point): Point {
  const x = (((lon + 180) / 360) * 65536 - 34130) * 75;
  const y = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) * 32768 - 23726) * 75;
  return [Number(x.toFixed(5)), Number(y.toFixed(5))];
}

export function fromMap([x, y]: Point): Point {
  return [
    (Math.atan(Math.sinh(Math.PI * (1 - (y / 75 + 23726) / 32768))) * 180) / Math.PI,
    ((x / 75 + 34130) / 65536) * 360 - 180,
  ];
}

export function inCuneo(point: Point) {
  const [x, y] = toMap(point);
  return x >= 0 && x <= 1050 && y >= 0 && y <= 600;
}
export function inSriLanka([lat, lon]: Point) {
  return lat >= 6 && lat <= 10 && lon >= 79 && lon <= 82;
}
export const sriLankaNW = toMap([10, 79]);
export const sriLankaSE = toMap([6, 82]);
export function geometryFor(points: Point[]) {
  return fieldGeometry(points.map(([lat, lon]) => [lon, lat]));
}

export function parcelView(points: Point[], detail = false) {
  const p = points.map(toMap);
  const xs = p.map(([x]) => x),
    ys = p.map(([, y]) => y);
  const left = Math.min(...xs),
    top = Math.min(...ys);
  const w = Math.max(...xs) - left,
    h = Math.max(...ys) - top;
  const side = Math.max(8, w, h) * 1.35;
  const width = detail ? Math.max(8, w) * 1.28 : side;
  const height = detail ? Math.max(8, h) * 1.45 : side;
  return [left + (w - width) / 2, top + (h - height) / 2, width, height].join(' ');
}

// Demonstration parcels traced on the Cuneo orthophoto. Names follow the field-management clip.
const samples: [string, string, string, Point[]][] = [
  [
    'Ricati EST',
    'San Defendente',
    'Frumento Duro (Grano)',
    [
      [256, 150],
      [273, 150],
      [248, 243],
      [233, 240],
    ],
  ],
  [
    'Ricati OVEST',
    'San Defendente',
    'Pero (AD AQUI)',
    [
      [276, 151],
      [297, 153],
      [289, 179],
      [269, 176],
    ],
  ],
  [
    'Conte',
    'Conti',
    'Granturco (Mais)',
    [
      [385, 169],
      [403, 170],
      [397, 209],
      [369, 208],
    ],
  ],
  [
    'Ferro',
    'Conti',
    'Frumento Duro (Grano)',
    [
      [410, 169],
      [430, 172],
      [419, 225],
      [401, 222],
    ],
  ],
  [
    'Contessa OVEST',
    'Conti',
    'Prato Pascolo',
    [
      [175, 66],
      [190, 66],
      [190, 116],
      [175, 117],
    ],
  ],
  [
    'Contessa EST',
    'Conti',
    'Orzo (ORZO NUDO)',
    [
      [192, 68],
      [214, 69],
      [213, 116],
      [193, 118],
    ],
  ],
  [
    'Grana OVEST',
    'Conti',
    'Granturco (Mais)',
    [
      [321, 113],
      [353, 115],
      [382, 123],
      [395, 136],
      [396, 165],
      [347, 166],
      [337, 156],
      [300, 152],
      [302, 131],
    ],
  ],
  [
    'Sopra cascina Rossi',
    'Conti',
    'Fragola',
    [
      [149, 486],
      [165, 482],
      [162, 549],
      [150, 549],
    ],
  ],
];

export const galleryFields: XFarmField[] = samples.map(([name, group, crop, points], i) => {
  const coordinates = points.map(fromMap);
  const geom = geometryFor(coordinates);
  const color = [
    '#daa746',
    '#84aa65',
    '#ddb348',
    '#cf9835',
    '#689861',
    '#bfa04b',
    '#deb14c',
    '#bb6568',
  ][i];
  const variety = i === 6 ? 'WAXY' : '';
  return {
    id: 'cuneo-' + i,
    name,
    group,
    coordinates,
    center: [geom.latitude, geom.longitude],
    surface_ha: geom.area_ha,
    farmingType: 'Bio',
    currentCrop: crop,
    currentVariety: variety,
    cropColor: color,
    cropCategory: crop,
    recentRainMm: 63.7,
    rotations: [crop, i === 6 ? 'Pomodoro' : 'Orzo', 'Frumento Tenero (Grano)'].map((c, n) => ({
      year: 2024 - n,
      crop: c,
      variety: n === 2 ? 'SOLEHIO' : n === 0 ? variety : '',
      area_ha: geom.area_ha,
      color,
    })),
    activities: [
      {
        id: 'sample-irrigation-' + i,
        title: 'Irrigating',
        crop,
        variety,
        date: '16/06/2023',
        status: 'Done',
      },
    ],
  };
});

export function exportBoundaries(fields: XFarmField[]) {
  const features = fields
    .filter((f) => f.coordinates.length >= 3)
    .map((f) => ({
      type: 'Feature',
      properties: { name: f.name, group: f.group, crop: f.currentCrop },
      geometry: {
        type: 'Polygon',
        coordinates: [[...f.coordinates, f.coordinates[0]].map(([lat, lon]) => [lon, lat])],
      },
    }));
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ type: 'FeatureCollection', features })], {
      type: 'application/geo+json',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = (fields.length === 1 ? fields[0].name : 'xFarm-boundaries') + '.geojson';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
