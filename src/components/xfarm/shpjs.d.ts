declare module 'shpjs' {
  import type { FeatureCollection } from 'geojson';
  export default function readShapefile(
    data: ArrayBuffer | { shp: ArrayBuffer },
  ): Promise<FeatureCollection | FeatureCollection[]>;
}
