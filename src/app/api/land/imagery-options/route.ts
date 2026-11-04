import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json',
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) throw new Error('Wayback fetch failed');
    const data = await res.json();
    const values = Object.entries(data);
    const selected: [string, any][] = values.slice(0, 24);
    const years = new Set<string>();
    for (const [k, v] of values.slice(24) as [string, any][]) {
      const year = v.itemTitle?.slice(-11, -7);
      if (year && !years.has(year)) {
        selected.push([k, v]);
        years.add(year);
      }
    }
    return NextResponse.json({
      mode: 'live',
      options: selected.map(([k, v]) => ({
        id: k,
        name: v.itemTitle,
        url: v.itemURL
          ?.replace('{level}', '{z}')
          .replace('{row}', '{y}')
          .replace('{col}', '{x}'),
      })),
      note: 'Archive release dates are not sensor acquisition dates.',
    });
  } catch {
    return NextResponse.json({
      mode: 'fallback',
      options: [
        {
          id: 'current',
          name: 'World Imagery (Current)',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        },
      ],
      note: 'Default basemap active.',
    });
  }
}
