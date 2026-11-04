import { NextRequest, NextResponse } from 'next/server';

const NSDI = 'https://gisapps.nsdi.gov.lk/server/rest/services/Srilanka/Agriculture/MapServer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: layerId } = await params;
    const { searchParams } = new URL(req.url);
    const bboxStr = searchParams.get('bbox') || '';
    const detail = searchParams.get('detail') || 'balanced';

    const tolerance = detail === 'overview' ? 0.001 : detail === 'balanced' ? 0.0001 : 0;
    const qParams = new URLSearchParams({
      f: 'geojson',
      where: '1=1',
      geometry: bboxStr,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      outSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      resultRecordCount: '100',
      geometryPrecision: '7',
    });
    if (tolerance) qParams.set('maxAllowableOffset', tolerance.toString());

    const res = await fetch(`${NSDI}/${layerId}/query?${qParams.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('ArcGIS query failed');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], error: err?.message },
      { status: 200 },
    );
  }
}
