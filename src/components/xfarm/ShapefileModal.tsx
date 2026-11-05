'use client';
import { useState } from 'react';
import { FileUp, Layers, X } from 'lucide-react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { geometryFor, type Point } from './parcels';
import { XFARM_FIELDS, type XFarmField } from './xfarmData';

async function readParcels(file: File): Promise<XFarmField[]> {
  let data: FeatureCollection | FeatureCollection[] | Feature | Geometry;
  if (/\.(shp|zip)$/i.test(file.name)) {
    const { default: read } = await import('shpjs');
    const bytes = await file.arrayBuffer();
    data = await read(/\.zip$/i.test(file.name) ? bytes : { shp: bytes });
  } else data = JSON.parse(await file.text());
  const features = (Array.isArray(data) ? data : [data]).flatMap((item) => {
    if (item.type === 'FeatureCollection') return item.features;
    if (item.type === 'Feature') return [item];
    return [{ type: 'Feature', properties: {}, geometry: item } as Feature];
  });
  if (!features.length) throw Error('The file contains no fields.');
  return features.map((feature, i) => {
    const shape = feature.geometry;
    if (shape?.type !== 'Polygon' || shape.coordinates.length !== 1)
      throw Error('Each field must be one polygon with a single outer boundary.');
    const ring = shape.coordinates[0];
    if (
      !ring.length ||
      ring.some(
        (p) =>
          !Number.isFinite(p[0]) ||
          !Number.isFinite(p[1]) ||
          Math.abs(p[0]) > 180 ||
          Math.abs(p[1]) >= 85,
      )
    )
      throw Error('Use WGS84 coordinates or include the .prj in a ZIP.');
    const coordinates: Point[] = ring.map(([lon, lat]) => [lat, lon]);
    if (coordinates[0].join() === coordinates.at(-1)?.join()) coordinates.pop();
    const g = geometryFor(coordinates),
      properties = feature.properties ?? {};
    const crop = String(properties.crop || 'Unassigned');
    return {
      id: crypto.randomUUID(),
      name: String(
        properties.name ||
          file.name.replace(/\.[^.]+$/, '') + (features.length > 1 ? ' ' + (i + 1) : ''),
      ),
      group: String(properties.group || 'Imported'),
      coordinates,
      center: [g.latitude, g.longitude],
      farmingType: 'Conventional',
      surface_ha: g.area_ha,
      currentCrop: crop,
      currentVariety: '',
      cropCategory: crop,
      cropColor: '#769b56',
      recentRainMm: 0,
      rotations: [
        { year: new Date().getFullYear(), crop, variety: '', area_ha: g.area_ha, color: '#769b56' },
      ],
      activities: [],
    };
  });
}

export function ShapefileModal({
  isOpen = true,
  onClose,
  onImport,
  onImportField,
  it = false,
}: {
  isOpen?: boolean;
  onClose: () => void;
  onImport?: (fields: XFarmField[]) => void;
  onImportField?: (fieldName: string, cropName: string, areaHa: number) => void;
  it?: boolean;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
  return (
    <div className="xfarm-modal-backdrop">
      <section className="parcel-import" role="dialog" aria-label="GIS import">
        <header>
          <h2>{it ? 'Importa da file' : 'Import from file'}</h2>
          <button disabled={busy} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <p>{it ? 'Esempio locale' : 'Local sample'}</p>
        <button
          className="parcel-sample"
          onClick={() => {
            const f = XFARM_FIELDS.find((f) => f.id === 'confreria-sud')!;
            const sampleFields = [
              {
                ...f,
                id: crypto.randomUUID(),
                name: 'Field layout-tomato',
                group: 'Conti',
                activities: [],
              },
            ];
            if (onImport) onImport(sampleFields);
            if (onImportField) {
              onImportField('Field layout-tomato', sampleFields[0].currentCrop, sampleFields[0].surface_ha);
            }
          }}
        >
          <Layers />
          Field layout-tomato.shp
        </button>
        <label>
          <FileUp size={17} />
          {it ? 'Scegli dal dispositivo' : 'Choose from device'}
          <input
            type="file"
            accept=".shp,.zip,.geojson,.json"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = '';
              setBusy(true);
              setError('');
              try {
                const imported = await readParcels(file);
                if (onImport) onImport(imported);
                if (onImportField && imported[0]) {
                  onImportField(imported[0].name, imported[0].currentCrop, imported[0].surface_ha);
                }
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
          />
        </label>
        <small>GeoJSON · WGS84 SHP · ZIP (SHP + PRJ)</small>
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  );
}
