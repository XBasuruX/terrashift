import { NextRequest, NextResponse } from 'next/server';
import modisFixture from '../../../../backend/fixtures/modis_anuradhapura_2023_2025.json';

const NDVI = '250m_16_days_NDVI';
const RELIABILITY = '250m_16_days_pixel_reliability';
const QUALITY = '250m_16_days_VI_Quality';

function parseModis(batches: any[]) {
  const byDate: Record<string, Record<string, number | null>> = {};
  for (const payload of batches) {
    for (const item of payload.subset || []) {
      if (![NDVI, RELIABILITY, QUALITY].includes(item.band)) continue;
      const val = item.data?.length === 1 ? item.data[0] : null;
      if (!byDate[item.calendar_date]) byDate[item.calendar_date] = {};
      byDate[item.calendar_date][item.band] = val;
    }
  }

  const records = [];
  for (const [day, bands] of Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))) {
    const raw = bands[NDVI];
    const reliability = bands[RELIABILITY];
    const qa = bands[QUALITY];
    const validRange = raw !== null && raw !== undefined && raw >= -2000 && raw <= 10000;
    const goodQa =
      qa !== null &&
      qa !== undefined &&
      qa !== 65535 &&
      (qa & 3) === 0 &&
      ((qa >> 2) & 15) <= 2 &&
      (qa & ((1 << 8) | (1 << 10) | (1 << 14) | (1 << 15))) === 0;

    const accepted = validRange && reliability === 0 && goodQa;
    records.push({
      date: day,
      ndvi: accepted && raw !== null ? Math.round(raw * 0.0001 * 10000) / 10000 : null,
      raw_ndvi: validRange && raw !== null ? Math.round(raw * 0.0001 * 10000) / 10000 : null,
      pixel_reliability: reliability,
      vi_quality: qa,
      accepted,
    });
  }
  return records;
}

export async function POST(req: NextRequest) {
  try {
    const records = parseModis(modisFixture.batches);
    return NextResponse.json({
      records,
      mode: 'cached',
      source: 'NASA MODIS MOD13Q1 via ORNL DAAC',
      product: 'MOD13Q1; service collection version must be verified for each acquisition',
      classification: 'QA-screened satellite vegetation index',
      resolution: 'Nominal 250 m; sinusoidal cell ~231.66 m',
      temporal: '16-day composite; date is composite start',
      units: 'NDVI, dimensionless',
      accepted: records.filter((r) => r.accepted).length,
    });
  } catch (e: any) {
    return NextResponse.json({ records: [], mode: 'unavailable', warning: e?.message });
  }
}
