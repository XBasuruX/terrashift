import { NextRequest, NextResponse } from 'next/server';

const NSDI = 'https://gisapps.nsdi.gov.lk/server/rest/services/Srilanka/Agriculture/MapServer';
const LAYERS: Record<number, string> = {
  24: 'Soil',
  34: 'Agro ecological zones',
  21: 'Land use',
  26: 'Irrigation schemes',
  27: 'Groundwater prospects',
};

export async function POST(req: NextRequest) {
  try {
    const q = await req.json().catch(() => ({}));
    const boundary = q.boundary || [];
    const geometry =
      boundary.length >= 3
        ? JSON.stringify({
            rings: [[...boundary, boundary[0]]],
            spatialReference: { wkid: 4326 },
          })
        : `${q.longitude || 80.4037},${q.latitude || 8.3114}`;

    const layerPromises = Object.entries(LAYERS).map(async ([id, name]) => {
      try {
        const params = new URLSearchParams({
          f: 'json',
          geometry,
          geometryType: boundary.length >= 3 ? 'esriGeometryPolygon' : 'esriGeometryPoint',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: 'false',
          resultRecordCount: '20',
        });
        const res = await fetch(`${NSDI}/${id}/query?${params.toString()}`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) throw new Error('Query failed');
        const d = await res.json();
        const fields: Record<string, string> = {};
        for (const f of d.fields || []) fields[f.name] = f.alias || f.name;

        const rows = (d.features || []).map((feat: any) => {
          const row: Record<string, any> = {};
          for (const [k, v] of Object.entries(feat.attributes || {})) {
            const kl = k.toLowerCase();
            if (v !== null && !['objectid', 'st_area(shape)', 'st_length(shape)', 'perimeter'].includes(kl) && !kl.includes('area')) {
              row[fields[k] || k] = v;
            }
          }
          return row;
        });

        return {
          id: Number(id),
          name,
          status: 'live',
          records: rows,
          source: `${NSDI}/${id}`,
          truncated: d.exceededTransferLimit || false,
        };
      } catch (err: any) {
        return {
          id: Number(id),
          name,
          status: 'unavailable',
          records: [],
          error: err?.message || 'Error',
          source: `${NSDI}/${id}`,
        };
      }
    });

    const results = await Promise.all(layerPromises);
    return NextResponse.json({
      layers: results,
      retrieved_at: new Date().toISOString(),
      scope: 'Intersecting regional map units; not a soil test.',
    });
  } catch (e: any) {
    return NextResponse.json({ layers: [], error: e?.message }, { status: 500 });
  }
}
