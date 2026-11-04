import type { Farm, Scenario } from './types';
export const defaultFarm: Farm = {
  id: 'anuradhapura-sample',
  category: 'Sri Lanka pilot',
  boundary: [],
  name: 'Anuradhapura learning farm',
  latitude: 8.3114,
  longitude: 80.4037,
  area_ha: 12,
  soil: 'loam',
  available_water_mm: 120,
  irrigation_mm: 80,
  season_start_month: 10,
  season_length_days: 120,
  previous_crop: 'rice',
  existing: ['rice', 'rice', 'maize', 'rice'],
  allowed_crops: ['rice', 'maize', 'mungbean', 'cowpea', 'sorghum', 'groundnut'],
  equipment: 'paddy',
  market_note: 'Confirm buyers for pulses before changing the rotation.',
  priorities: { water: 40, diversity: 35, suitability: 25 },
};
export const defaultScenario: Scenario = {
  kind: 'typical',
  temperature_delta: 0,
  rainfall_factor: 1,
};
export const samples = [
  {
    name: 'Anuradhapura, Sri Lanka',
    latitude: 8.3114,
    longitude: 80.4037,
    label: 'Dry-zone smallholder landscape',
    area: 12,
  },
  {
    name: 'Nakuru, Kenya',
    latitude: -0.3031,
    longitude: 36.08,
    label: 'East African highlands',
    area: 8,
  },
  {
    name: 'Fresno, California',
    latitude: 36.7378,
    longitude: -119.7871,
    label: 'Irrigated Central Valley',
    area: 24,
  },
  {
    name: 'Pune, India',
    latitude: 18.5204,
    longitude: 73.8567,
    label: 'Monsoon farming landscape',
    area: 6,
  },
];
