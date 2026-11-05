export interface XFarmField {
  id: string;
  name: string;
  surface_ha: number;
  group: string;
  farmingType: 'Integrated' | 'Bio' | 'Conventional' | 'Unspecified';
  currentCrop: string;
  currentVariety: string;
  cropColor: string;
  cropCategory: string;
  coordinates: [number, number][]; // [lat, lng] polygon vertices
  center: [number, number];
  rotations: {
    year: number;
    crop: string;
    variety: string;
    area_ha: number;
    color: string;
  }[];
  activities: {
    id: string;
    title: 'Defending' | 'Irrigating' | 'Harvesting' | 'Fertilizing' | 'Tillage';
    crop: string;
    variety: string;
    date: string;
    status: 'Done' | 'Expired' | 'Planned';
  }[];
  recentRainMm: number | null;
}

export interface XFarmMachinery {
  id: string;
  model: string;
  brand: string;
  type: 'Tractor' | 'Implement' | 'Harvester' | 'Sprayer';
  speedKmH: number | null;
  fuelLH: number | null;
  fuelPercent: number | null;
  status: 'In work' | 'Standby' | 'In shed';
  activeField?: string;
  attachedImplement?: string;
}

export interface SoilMoistureProbe {
  id: string;
  code: string;
  name: string;
  fieldId: string;
  fieldName: string;
  lat: number;
  lng: number;
  batteryPercent: number;
  lastDetection: string;
  depths: {
    depthCm: number;
    depthLabel: string;
    moisturePercent: number;
    minRange: number;
    maxRange: number;
  }[];
}

export interface ScoutingNote {
  id: string;
  title: string;
  category: 'General' | 'Disease' | 'Parasite' | 'Water' | 'Pest' | 'Damage' | 'Sanitation';
  categoryColor: string;
  date: string;
  author: string;
  fieldName: string;
  lat: number;
  lng: number;
  description: string;
}

export const XFARM_FIELDS: XFarmField[] = [
  {
    id: 'plot-n2',
    name: 'Plot N2 2023',
    surface_ha: 4.80,
    group: 'NORTH',
    farmingType: 'Integrated',
    currentCrop: 'Maize (corn) WAXY',
    currentVariety: 'LG 30703',
    cropColor: '#eab308',
    cropCategory: 'Granturco (Mais)',
    center: [44.3888, 7.5450],
    coordinates: [
      [44.3910, 7.5440],
      [44.3905, 7.5475],
      [44.3872, 7.5480],
      [44.3868, 7.5445],
      [44.3885, 7.5430],
    ],
    rotations: [
      { year: 2024, crop: 'Soft Wheat', variety: 'SOLEHIO', area_ha: 4.80, color: '#df9f32' },
      { year: 2023, crop: 'Maize (corn) *', variety: 'LG 30703', area_ha: 4.80, color: '#eab308' },
      { year: 2022, crop: 'Barley *', variety: 'TEKTOO', area_ha: 4.79, color: '#ca8a04' },
    ],
    activities: [
      { id: 'a1', title: 'Defending', crop: 'Maize (corn) WAXY', variety: 'LG 30703', date: '05/10/2023', status: 'Done' },
      { id: 'a2', title: 'Irrigating', crop: 'Maize (corn) WAXY', variety: 'LG 30703', date: '31/08/2023', status: 'Expired' },
      { id: 'a3', title: 'Harvesting', crop: 'Maize (corn) WAXY', variety: 'LG 30703', date: '10/07/2023', status: 'Done' },
      { id: 'a4', title: 'Defending', crop: 'Maize (corn) WAXY', variety: 'LG 30703', date: '09/06/2023', status: 'Expired' },
      { id: 'a5', title: 'Defending', crop: 'Maize (corn) WAXY', variety: 'LG 30703', date: '29/05/2023', status: 'Expired' },
    ],
    recentRainMm: 63.71,
  },
  {
    id: 'field-ovest',
    name: 'Field OVEST 2023',
    surface_ha: 6.20,
    group: 'WEST',
    farmingType: 'Bio',
    currentCrop: 'Soft Wheat (Grano)',
    currentVariety: 'SOLEHIO',
    cropColor: '#df9f32',
    cropCategory: 'Frumento Tenero',
    center: [44.3875, 7.5405],
    coordinates: [
      [44.3895, 7.5385],
      [44.3890, 7.5420],
      [44.3855, 7.5425],
      [44.3850, 7.5388],
    ],
    rotations: [
      { year: 2024, crop: 'Soybean', variety: 'HI-PRO', area_ha: 6.20, color: '#65a30d' },
      { year: 2023, crop: 'Soft Wheat', variety: 'SOLEHIO', area_ha: 6.20, color: '#df9f32' },
      { year: 2022, crop: 'Maize', variety: 'PIONEER 1570', area_ha: 6.20, color: '#eab308' },
    ],
    activities: [
      { id: 'a6', title: 'Harvesting', crop: 'Soft Wheat', variety: 'SOLEHIO', date: '15/07/2023', status: 'Done' },
      { id: 'a7', title: 'Defending', crop: 'Soft Wheat', variety: 'SOLEHIO', date: '02/05/2023', status: 'Done' },
    ],
    recentRainMm: 58.40,
  },
  {
    id: 'tetto-patta',
    name: 'Tetto Patta',
    surface_ha: 3.40,
    group: 'NORTH-EAST',
    farmingType: 'Integrated',
    currentCrop: 'Soybean (Soia)',
    currentVariety: 'PR92M22',
    cropColor: '#65a30d',
    cropCategory: 'Soia',
    center: [44.3920, 7.5465],
    coordinates: [
      [44.3935, 7.5455],
      [44.3932, 7.5482],
      [44.3912, 7.5480],
      [44.3915, 7.5452],
    ],
    rotations: [
      { year: 2024, crop: 'Maize', variety: 'DEKALB 6808', area_ha: 3.40, color: '#eab308' },
      { year: 2023, crop: 'Soybean', variety: 'PR92M22', area_ha: 3.40, color: '#65a30d' },
      { year: 2022, crop: 'Winter Wheat', variety: 'AUBUSSON', area_ha: 3.40, color: '#df9f32' },
    ],
    activities: [
      { id: 'a8', title: 'Defending', crop: 'Soybean', variety: 'PR92M22', date: '12/08/2023', status: 'Done' },
      { id: 'a9', title: 'Irrigating', crop: 'Soybean', variety: 'PR92M22', date: '25/07/2023', status: 'Done' },
    ],
    recentRainMm: 62.10,
  },
  {
    id: 'confreria-sud',
    name: 'Confreria Sud',
    surface_ha: 5.10,
    group: 'SOUTH',
    farmingType: 'Bio',
    currentCrop: 'Tomato (Pomodoro)',
    currentVariety: 'SAN MARZANO',
    cropColor: '#dc2626',
    cropCategory: 'Pomodoro',
    center: [44.3830, 7.5430],
    coordinates: [
      [44.3845, 7.5410],
      [44.3842, 7.5455],
      [44.3815, 7.5450],
      [44.3818, 7.5415],
    ],
    rotations: [
      { year: 2024, crop: 'Barley', variety: 'EXPLORER', area_ha: 5.10, color: '#ca8a04' },
      { year: 2023, crop: 'Tomato', variety: 'SAN MARZANO', area_ha: 5.10, color: '#dc2626' },
      { year: 2022, crop: 'Alfalfa (Fieno)', variety: 'GEA', area_ha: 5.10, color: '#87bd9a' },
    ],
    activities: [
      { id: 'a10', title: 'Harvesting', crop: 'Tomato', variety: 'SAN MARZANO', date: '20/09/2023', status: 'Done' },
      { id: 'a11', title: 'Irrigating', crop: 'Tomato', variety: 'SAN MARZANO', date: '10/08/2023', status: 'Done' },
    ],
    recentRainMm: 65.20,
  },
  {
    id: 'villa-oldofredi',
    name: 'Villa Oldofredi Vineyard',
    surface_ha: 2.80,
    group: 'CENTRAL',
    farmingType: 'Bio',
    currentCrop: 'Vineyard (Vite)',
    currentVariety: 'NEBBIOLO',
    cropColor: '#8b5cf6',
    cropCategory: 'Vite',
    center: [44.3860, 7.5485],
    coordinates: [
      [44.3872, 7.5475],
      [44.3870, 7.5500],
      [44.3848, 7.5498],
      [44.3850, 7.5472],
    ],
    rotations: [
      { year: 2024, crop: 'Vineyard', variety: 'NEBBIOLO', area_ha: 2.80, color: '#8b5cf6' },
      { year: 2023, crop: 'Vineyard', variety: 'NEBBIOLO', area_ha: 2.80, color: '#8b5cf6' },
      { year: 2022, crop: 'Vineyard', variety: 'NEBBIOLO', area_ha: 2.80, color: '#8b5cf6' },
    ],
    activities: [
      { id: 'a12', title: 'Harvesting', crop: 'Vineyard', variety: 'NEBBIOLO', date: '08/10/2023', status: 'Done' },
      { id: 'a13', title: 'Defending', crop: 'Vineyard', variety: 'NEBBIOLO', date: '15/06/2023', status: 'Done' },
    ],
    recentRainMm: 60.80,
  },
];

export const XFARM_MACHINERY: XFarmMachinery[] = [
  {
    id: 'm1',
    model: 'JD 6175R',
    brand: 'John Deere',
    type: 'Tractor',
    speedKmH: 6.00,
    fuelLH: 25.50,
    fuelPercent: 78,
    status: 'In work',
    activeField: 'Plot N2 2023',
    attachedImplement: 'Seminatrice 8F/75',
  },
  {
    id: 'm2',
    model: 'JD 6145R',
    brand: 'John Deere',
    type: 'Tractor',
    speedKmH: null,
    fuelLH: 2.30,
    fuelPercent: 91,
    status: 'Standby',
    attachedImplement: 'None',
  },
  {
    id: 'm3',
    model: 'Seminatrice 8F/75',
    brand: 'Gaspardo',
    type: 'Implement',
    speedKmH: 6.00,
    fuelLH: null,
    fuelPercent: null,
    status: 'In work',
    activeField: 'Plot N2 2023',
  },
  {
    id: 'm4',
    model: 'Erpice rotante',
    brand: 'Vigolo',
    type: 'Implement',
    speedKmH: null,
    fuelLH: null,
    fuelPercent: null,
    status: 'In shed',
  },
  {
    id: 'm5',
    model: 'Trivomere',
    brand: 'De Franceschi',
    type: 'Implement',
    speedKmH: null,
    fuelLH: null,
    fuelPercent: null,
    status: 'In shed',
  },
  {
    id: 'm6',
    model: 'Rotolone RM',
    brand: 'RM Irrigation Equipment',
    type: 'Implement',
    speedKmH: null,
    fuelLH: null,
    fuelPercent: null,
    status: 'In work',
    activeField: 'Field OVEST 2023',
  },
  {
    id: 'm7',
    model: 'Rotopressa',
    brand: 'Feraboli',
    type: 'Implement',
    speedKmH: null,
    fuelLH: null,
    fuelPercent: null,
    status: 'In shed',
  },
  {
    id: 'm8',
    model: 'Spandiconcime',
    brand: 'Amazone-Werke',
    type: 'Implement',
    speedKmH: null,
    fuelLH: null,
    fuelPercent: null,
    status: 'In shed',
  },
];

export const XFARM_PROBES: SoilMoistureProbe[] = [
  {
    id: 'probe-1',
    code: 'DE6008D81F163B29',
    name: 'Sentek 60cm Drill & Drop',
    fieldId: 'plot-n2',
    fieldName: 'Plot N2 (North Section)',
    lat: 44.3892,
    lng: 7.5458,
    batteryPercent: 92,
    lastDetection: '09/10/2023 11:00',
    depths: [
      { depthCm: 10, depthLabel: 'Soil moisture 1 (Shallow)', moisturePercent: 6.30, minRange: 6.2, maxRange: 6.9 },
      { depthCm: 20, depthLabel: 'Soil moisture 2', moisturePercent: 12.80, minRange: 12.4, maxRange: 12.9 },
      { depthCm: 30, depthLabel: 'Soil moisture 3', moisturePercent: 19.50, minRange: 19.5, maxRange: 19.9 },
      { depthCm: 40, depthLabel: 'Soil moisture 4', moisturePercent: 20.66, minRange: 20.7, maxRange: 21.0 },
      { depthCm: 50, depthLabel: 'Soil moisture 5', moisturePercent: 39.40, minRange: 39.4, maxRange: 39.7 },
      { depthCm: 60, depthLabel: 'Soil moisture 6 (Deep)', moisturePercent: 43.20, minRange: 43.0, maxRange: 43.5 },
    ],
  },
  {
    id: 'probe-2',
    code: 'DE6008D81F163C88',
    name: 'Sentek 60cm Drill & Drop #2',
    fieldId: 'field-ovest',
    fieldName: 'Field OVEST',
    lat: 44.3870,
    lng: 7.5410,
    batteryPercent: 88,
    lastDetection: '09/10/2023 11:15',
    depths: [
      { depthCm: 10, depthLabel: 'Soil moisture 1 (Shallow)', moisturePercent: 18.20, minRange: 17.5, maxRange: 19.0 },
      { depthCm: 20, depthLabel: 'Soil moisture 2', moisturePercent: 22.40, minRange: 21.9, maxRange: 23.0 },
      { depthCm: 30, depthLabel: 'Soil moisture 3', moisturePercent: 26.80, minRange: 26.1, maxRange: 27.4 },
      { depthCm: 40, depthLabel: 'Soil moisture 4', moisturePercent: 28.50, minRange: 28.0, maxRange: 29.1 },
      { depthCm: 50, depthLabel: 'Soil moisture 5', moisturePercent: 34.10, minRange: 33.8, maxRange: 34.6 },
      { depthCm: 60, depthLabel: 'Soil moisture 6 (Deep)', moisturePercent: 38.90, minRange: 38.2, maxRange: 39.5 },
    ],
  },
];

export const XFARM_SCOUTING_NOTES: ScoutingNote[] = [
  {
    id: 'n1',
    title: 'Botrytis cinerea 1st detection',
    category: 'Disease',
    categoryColor: '#f472b6',
    date: '21/08/2023',
    author: 'Mario Rossi',
    fieldName: 'Field OVEST 2023',
    lat: 44.3872,
    lng: 7.5402,
    description: "First symptoms detected in this location, to be monitored. At the time of detection the disease appears contained and it's not spreading.",
  },
  {
    id: 'n2',
    title: 'Winter pruning completed',
    category: 'General',
    categoryColor: '#94a3b8',
    date: '08/02/2023',
    author: 'Mario Rossi',
    fieldName: 'Villa Oldofredi Vineyard',
    lat: 44.3855,
    lng: 7.5488,
    description: 'Guyot system pruning completed across all rows. Canes shredded into soil.',
  },
  {
    id: 'n3',
    title: 'Water stagnation',
    category: 'Water',
    categoryColor: '#38bdf8',
    date: '08/05/2023',
    author: 'Mario Rossi',
    fieldName: 'Field OVEST (Lower dip)',
    lat: 44.3862,
    lng: 7.5418,
    description: 'Runoff accumulation following 3-day heavy precipitation. Drainage ditch clearance required.',
  },
  {
    id: 'n4',
    title: 'Embankment breakage',
    category: 'Damage',
    categoryColor: '#c084fc',
    date: '08/04/2020',
    author: 'Mario Rossi',
    fieldName: 'Plot N2 2023',
    lat: 44.3889,
    lng: 7.5435,
    description: 'Minor erosion along western irrigation channel. Clay stabilization scheduled.',
  },
  {
    id: 'n5',
    title: 'Defence planning & pest threshold',
    category: 'Pest',
    categoryColor: '#a3e635',
    date: '27/10/2020',
    author: 'Mario Rossi',
    fieldName: 'Plot N2 2023',
    lat: 44.3902,
    lng: 7.5455,
    description: 'Pheromone trap monitor check. Population density within acceptable IPM tolerance.',
  },
];

export const CROP_DISTRIBUTION = [
  { name: 'Frumento Tenero (Soft Wheat)', percent: 27.83, color: '#df9f32', emoji: '🌾' },
  { name: 'Soia (Soybean)', percent: 3.96, color: '#65a30d', emoji: '🌱' },
  { name: 'Granturco (Maize)', percent: 5.17, color: '#eab308', emoji: '🌽' },
  { name: 'Fieno / Forage', percent: 0.82, color: '#87bd9a', emoji: '🌿' },
  { name: 'Vite (Vineyard)', percent: 0.30, color: '#8b5cf6', emoji: '🍇' },
  { name: 'Riso (Rice Paddy)', percent: 61.92, color: '#0284c7', emoji: '🌾' },
];

export const CROP_LEGEND = [
  { name: 'Maize (corn)', color: '#eab308' },
  { name: 'Hard wheat', color: '#df9f32' },
  { name: 'Soy', color: '#65a30d' },
  { name: 'Paddy (Rice)', color: '#0284c7' },
  { name: 'Carrot', color: '#f97316' },
  { name: 'Apple Tree', color: '#a855f7' },
  { name: 'Rapeseed', color: '#eab308' },
  { name: 'Poplar', color: '#16a34a' },
  { name: 'Bean', color: '#14b8a6' },
  { name: 'Tomato', color: '#dc2626' },
];
