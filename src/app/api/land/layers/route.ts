import { NextResponse } from 'next/server';

const NSDI = 'https://gisapps.nsdi.gov.lk/server/rest/services/Srilanka/Agriculture/MapServer';
const LAYERS: Record<number, string> = {
  24: 'Soil',
  34: 'Agro ecological zones',
  21: 'Land use',
  26: 'Irrigation schemes',
  27: 'Groundwater prospects',
};

export async function GET() {
  return NextResponse.json({
    service: NSDI,
    reference: 'https://nsdi.gov.lk/thematic-maps',
    layers: Object.entries(LAYERS).map(([id, name]) => ({
      id: Number(id),
      name,
    })),
  });
}
