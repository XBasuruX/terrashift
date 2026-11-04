import area from '@turf/area';
import centroid from '@turf/centroid';
import { polygon } from '@turf/helpers';
export function fieldGeometry(points: number[][]) {
  if (points.length < 3 || points.some((p) => p.length !== 2 || !p.every(Number.isFinite)))
    throw Error('Place at least three valid boundary points.');
  const shape = polygon([[...points, points[0]]]);
  const hectares = area(shape) / 10000;
  if (hectares < 0.001 || hectares > 100000)
    throw Error('Choose a field between 0.001 and 100,000 hectares.');
  // Reject crossings instead of accepting ambiguous drawn areas.
  const cross = (a: number[], b: number[], c: number[]) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < points.length; i++)
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue;
      const a = points[i],
        b = points[(i + 1) % points.length],
        c = points[j],
        d = points[(j + 1) % points.length];
      if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0)
        throw Error('Boundary edges cross. Undo a point and trace the perimeter.');
    }
  const [longitude, latitude] = centroid(shape).geometry.coordinates;
  return {
    area_ha: +hectares.toFixed(3),
    longitude: +longitude.toFixed(6),
    latitude: +latitude.toFixed(6),
    boundary: points,
  };
}
