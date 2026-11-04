import { NextRequest, NextResponse } from 'next/server';

const STAC = 'https://earth-search.aws.element84.com/v1';

export async function POST(req: NextRequest) {
  try {
    const q = await req.json().catch(() => ({}));
    let bbox = [
      (q.longitude || 80.4037) - 0.02,
      (q.latitude || 8.3114) - 0.02,
      (q.longitude || 80.4037) + 0.02,
      (q.latitude || 8.3114) + 0.02,
    ];
    if (q.boundary && q.boundary.length) {
      bbox = [
        Math.min(...q.boundary.map((v: number[]) => v[0])),
        Math.min(...q.boundary.map((v: number[]) => v[1])),
        Math.max(...q.boundary.map((v: number[]) => v[0])),
        Math.max(...q.boundary.map((v: number[]) => v[1])),
      ];
    }

    const res = await fetch(`${STAC}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collections: ['sentinel-2-l2a'],
        bbox,
        limit: 12,
        sortby: [{ field: 'properties.datetime', direction: 'desc' }],
      }),
    });

    if (!res.ok) throw new Error('STAC search failed');
    const d = await res.json();
    return NextResponse.json({
      scenes: (d.features || []).map((f: any) => ({
        id: f.id,
        date: f.properties?.datetime,
        cloud: f.properties?.['eo:cloud_cover'],
        visual: f.assets?.visual?.href,
        resolution: f.assets?.visual?.gsd || 10,
        thumbnail: f.assets?.thumbnail?.href,
        source: `${STAC}/collections/sentinel-2-l2a/items/${f.id}`,
      })),
      bbox,
      note: 'Latest acquisitions, not live video. Cloud percentage is tile-wide.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: 'Sentinel catalog unavailable; Esri imagery remains available.' },
      { status: 503 },
    );
  }
}
