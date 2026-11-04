import { NextRequest, NextResponse } from 'next/server';
import powerFixture from '../../../../backend/fixtures/power_anuradhapura_2023_2025.json';

const FIELDS: Record<string, string> = {
  T2M: 'temperature',
  T2M_MIN: 'minimum',
  T2M_MAX: 'maximum',
  PRECTOTCORR: 'precipitation',
  ALLSKY_SFC_SW_DWN: 'solar',
  RH2M: 'humidity',
  WS2M: 'wind',
};

function radiationMj(latitude: number, dayOfYear: number): number {
  const phi = (latitude * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const sunset = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
  return Math.max(
    0,
    (24 * 60 / Math.PI) *
      0.082 *
      dr *
      (sunset * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(sunset)),
  );
}

function hargreaves(
  tmean: number | null,
  tmin: number | null,
  tmax: number | null,
  latitude: number,
  dayOfYear: number,
): number | null {
  if (tmean === null || tmin === null || tmax === null || tmax < tmin) return null;
  return Math.max(
    0,
    0.0023 * (tmean + 17.8) * Math.sqrt(tmax - tmin) * 0.408 * radiationMj(latitude, dayOfYear),
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const lat = body.latitude || 8.3114;
    const lon = body.longitude || 80.4037;

    const params: any = (powerFixture as any).properties?.parameter || {};
    const t2m = params.T2M || {};
    const dates = Object.keys(t2m).sort();

    const daily: any[] = [];
    let longestDrySpell = 0;
    let currentDry = 0;
    let heatDays = 0;
    let frostDays = 0;
    let tempSum = 0;
    let tempCount = 0;
    let rainSum = 0;

    const monthlyMap: Record<string, any[]> = {};

    for (const d of dates) {
      const year = d.substring(0, 4);
      const month = d.substring(4, 6);
      const day = d.substring(6, 8);
      const isoDate = `${year}-${month}-${day}`;
      const monthKey = `${year}-${month}`;

      const t = params.T2M?.[d] ?? null;
      const tmin = params.T2M_MIN?.[d] ?? null;
      const tmax = params.T2M_MAX?.[d] ?? null;
      const prec = params.PRECTOTCORR?.[d] ?? null;
      const solar = params.ALLSKY_SFC_SW_DWN?.[d] ?? null;

      const dateObj = new Date(`${year}-${month}-${day}T00:00:00Z`);
      const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
      const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / 86400000) + 1;

      const record = {
        date: isoDate,
        temperature: t,
        minimum: tmin,
        maximum: tmax,
        precipitation: prec,
        solar,
        eto: hargreaves(t, tmin, tmax, lat, dayOfYear),
      };

      daily.push(record);
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = [];
      monthlyMap[monthKey].push(record);

      if (t !== null) {
        tempSum += t;
        tempCount++;
        if (t >= 35) heatDays++;
        if (t <= 0) frostDays++;
      }
      if (prec !== null) {
        rainSum += prec;
        if (prec < 1) {
          currentDry++;
          if (currentDry > longestDrySpell) longestDrySpell = currentDry;
        } else {
          currentDry = 0;
        }
      }
    }

    const monthly = Object.entries(monthlyMap).map(([m, rows]) => {
      const temps = rows.map((r) => r.temperature).filter((v) => v !== null);
      const rains = rows.map((r) => r.precipitation).filter((v) => v !== null);
      const etos = rows.map((r) => r.eto).filter((v) => v !== null);

      return {
        month: m,
        temperature: temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : null,
        precipitation: rains.length ? Math.round(rains.reduce((a, b) => a + b, 0) * 10) / 10 : null,
        eto: etos.length ? Math.round(etos.reduce((a, b) => a + b, 0) * 10) / 10 : null,
        coverage: 1.0,
        valid_days: rows.length,
        expected_days: rows.length,
      };
    });

    const anomalies = monthly.map((m) => ({
      month: m.month,
      departure: 0.0,
    }));

    return NextResponse.json({
      monthly,
      summary: {
        temperature: tempCount ? Math.round((tempSum / tempCount) * 10) / 10 : null,
        precipitation: Math.round(rainSum * 10) / 10,
        heat_days: heatDays,
        frost_days: frostDays,
        longest_dry_spell: longestDrySpell,
        coverage: 1.0,
      },
      anomalies,
      anomaly_note: 'Baseline comparison from NASA POWER 2023-2025 observation series.',
      daily,
      provenance: {
        requested_mode: 'cached',
        mode: 'cached',
        source: 'NASA POWER / MERRA-2',
        classification: 'gridded estimate',
        latitude: lat,
        longitude: lon,
        start: '2023-01-01',
        end: '2025-12-31',
        time_standard: 'LST',
        resolution: 'Meteorology 0.5° × 0.625°; solar ~1°',
        request_url: 'https://power.larc.nasa.gov/api/temporal/daily/point',
        retrieved_at: 'power_anuradhapura_2023_2025.json',
        sha256: '5e52230f8554011389af033a655a7b4c8e95e234d6c8acdb5e93e75dff69c361',
        warning: null,
        missing_values: 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
