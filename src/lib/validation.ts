import type { Farm } from './types';
const ids = new Set([
  'rice',
  'maize',
  'mungbean',
  'cowpea',
  'sorghum',
  'groundnut',
  'sunflower',
  'millet',
]);
export function isSavedFarm(input: unknown): input is Farm {
  if (!input || typeof input !== 'object') return false;
  const f = input as Record<string, unknown>;
  if (
    f.boundary !== undefined &&
    (!Array.isArray(f.boundary) ||
      f.boundary.length > 200 ||
      f.boundary.some(
        (p) =>
          !Array.isArray(p) ||
          p.length !== 2 ||
          !p.every(Number.isFinite) ||
          Math.abs(p[0]) > 180 ||
          Math.abs(p[1]) > 85,
      ))
  )
    return false;
  const bounded = (key: string, min: number, max: number) =>
    typeof f[key] === 'number' &&
    Number.isFinite(f[key]) &&
    (f[key] as number) >= min &&
    (f[key] as number) <= max;
  const crops = (value: unknown) =>
    Array.isArray(value) && value.every((v) => typeof v === 'string' && ids.has(v));
  const p = f.priorities as Record<string, unknown> | undefined;
  return (
    typeof f.name === 'string' &&
    f.name.length > 0 &&
    f.name.length <= 100 &&
    bounded('latitude', -85, 85) &&
    bounded('longitude', -180, 180) &&
    bounded('area_ha', 0.000001, 100000) &&
    ['sandy', 'loam', 'clay'].includes(String(f.soil)) &&
    bounded('available_water_mm', 20, 300) &&
    bounded('irrigation_mm', 0, 1000) &&
    bounded('season_start_month', 1, 12) &&
    Number.isInteger(f.season_start_month) &&
    bounded('season_length_days', 60, 180) &&
    Number.isInteger(f.season_length_days) &&
    typeof f.previous_crop === 'string' &&
    ids.has(f.previous_crop) &&
    crops(f.existing) &&
    (f.existing as unknown[]).length === 4 &&
    crops(f.allowed_crops) &&
    (f.allowed_crops as unknown[]).length >= 1 &&
    (f.allowed_crops as unknown[]).length <= 8 &&
    ['standard', 'paddy'].includes(String(f.equipment)) &&
    typeof f.market_note === 'string' &&
    f.market_note.length <= 1000 &&
    Boolean(p) &&
    ['water', 'diversity', 'suitability'].every(
      (k) =>
        typeof p![k] === 'number' &&
        Number.isFinite(p![k]) &&
        (p![k] as number) >= 0 &&
        (p![k] as number) <= 100,
    ) &&
    ['water', 'diversity', 'suitability'].some((k) => (p![k] as number) > 0)
  );
}
