'use client';
import { useState } from 'react';
import { ArrowLeft, ClipboardPlus, Download, Layers, Leaf, Plus } from 'lucide-react';
import { ParcelPreview } from './ParcelPreview';
import { exportBoundaries, inCuneo, inSriLanka } from './parcels';
import type { Climate } from '@/lib/types';
import type { XFarmField, ScoutingNote } from './xfarmData';

interface Props {
  field: XFarmField | null;
  notes?: ScoutingNote[];
  lang?: 'IT' | 'EN';
  onClose: () => void;
  onActivity?: () => void;
  onConfigure?: () => void;
  climate?: Climate | null;
  onClimate?: () => void;
  onOpenRotationStudio?: () => void;
  onCrop?: (crop: XFarmField['rotations'][number]) => void;
  onAddActivityToField?: (fieldId: string, activity: any) => void;
}

export function FieldDetailDrawer({
  field,
  notes = [],
  lang = 'EN',
  onClose,
  onActivity = () => {},
  onClimate = () => {},
  climate = null,
  onConfigure = () => {},
  onOpenRotationStudio = () => {},
  onCrop = () => {},
  onAddActivityToField,
}: Props) {
  if (!field) return null;

  const it = lang === 'IT';
  const [tab, setTab] = useState(0);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'snazzy'>('satellite');
  const [year, setYear] = useState<number | null>(null);
  const [crop, setCrop] = useState('');
  const years = [...new Set(field.rotations.map((r) => r.year))].sort((a, b) => b - a);
  if (!years.length) years.push(new Date().getFullYear());
  const labels = it
    ? ['Coltura', 'Dettagli', 'Previsionali', 'Files']
    : ['Crops', 'Details', 'Forecasts', 'Files'];
  const related = notes.filter((n) => n.fieldName === field.name);

  return (
    <section className="parcel-detail">
      <div className="parcel-detail-map" style={{ position: 'relative' }}>
        <ParcelPreview field={field} detail mode={mapStyle} />

        {/* SATELLITE VS SNAZZY MAPS SWITCHER */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '12px',
            zIndex: 15,
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.92)',
            borderRadius: '6px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            style={{
              background: mapStyle === 'satellite' ? '#22c55e' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🛰️</span>
            <span>Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('snazzy')}
            style={{
              background: mapStyle === 'snazzy' ? '#22c55e' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🗺️</span>
            <span>Snazzy Maps</span>
          </button>
        </div>

        <div className="parcel-metadata">
          <button onClick={onClose} aria-label={it ? 'Torna ai campi' : 'Back to fields'}>
            <ArrowLeft size={19} />
          </button>
          <div>
            <b>{it ? 'Area totale' : 'Total area'}</b>
            {field.surface_ha.toFixed(2)} ha
          </div>
          <div>
            <b>{it ? 'Gruppo' : 'Group'}</b>
            {field.group}
          </div>
          <div>
            <b>{it ? 'Tipo' : 'Type'}</b>
            {field.farmingType}
          </div>
        </div>
        <strong className="parcel-map-name">
          <Layers size={14} />
          {field.name}
        </strong>
        <small className="map-credit">
          {mapStyle === 'snazzy'
            ? 'Snazzy Maps · Cartographic Vector Cadastre'
            : field.name.includes('Plot N2')
              ? 'High-Resolution Aerial Orthophoto · Maxar'
              : inCuneo(field.center)
                ? '© Arpa Piemonte · Regional Imagery'
                : inSriLanka(field.center)
                  ? 'NASA Blue Marble · regional context'
                  : 'Farm coordinates'}
        </small>
      </div>

      <div className="parcel-detail-body">
        <div className="parcel-switch">
          {labels.map((s, i) => (
            <button key={i} aria-pressed={i === tab} onClick={() => setTab(i)}>
              {s}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <>
            <div className="parcel-section-title">
              <h2>{it ? 'Colture' : 'Crops'}</h2>
              <button onClick={onOpenRotationStudio}>
                {it ? 'Studio rotazioni' : 'Rotation studio'} →
              </button>
            </div>
            <div className="parcel-years">
              {years.map((y) => (
                <section key={y}>
                  <h3>{y}</h3>
                  {field.rotations
                    .filter((r) => r.year === y)
                    .map((r, i) => (
                      <div className="parcel-crop-line" key={i}>
                        <Leaf size={14} />
                        <span>
                          {r.crop}
                          <small>{r.variety}</small>
                        </span>
                        <b>{r.area_ha.toFixed(2)} ha</b>
                      </div>
                    ))}
                  <button
                    onClick={() => {
                      setYear(y);
                      setCrop('');
                    }}
                  >
                    <Plus size={14} />
                    {it ? 'Aggiungi Coltura' : 'Add crop'}
                  </button>
                </section>
              ))}
            </div>

            <div className="parcel-section-title">
              <h2>{it ? 'Attività' : 'Activity'}</h2>
              <button onClick={onActivity}>
                <ClipboardPlus size={14} />
                {it ? 'Nuova attività' : 'New activity'}
              </button>
            </div>
            {field.activities.length ? (
              <ul className="parcel-activities">
                {field.activities.map((a) => (
                  <li key={a.id}>
                    <div>
                      <strong>{a.title}</strong>
                      <small>
                        {a.crop} {a.variety}
                      </small>
                    </div>
                    <span>{a.date}</span>
                    <b className={a.status.toLowerCase()}>{a.status}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-subtle">
                {it ? 'Nessuna attività registrata per questo campo.' : 'No operations recorded yet.'}
              </p>
            )}

            <div className="parcel-section-title">
              <h2>{it ? 'Note di campo' : 'Scouting notes'}</h2>
            </div>
            {related.length ? (
              <ul className="parcel-notes">
                {related.map((n) => (
                  <li key={n.id}>
                    <b style={{ color: n.categoryColor }}>{n.category}</b>
                    <strong>{n.title}</strong>
                    <p>{n.description}</p>
                    <small>
                      {n.date} · {n.author}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-subtle">
                {it ? 'Nessuna nota per questo campo.' : 'No scouting notes for this field yet.'}
              </p>
            )}
          </>
        )}

        {tab === 1 && (
          <div className="parcel-details-view">
            <dl>
              <dt>{it ? 'Superficie' : 'Surface'}</dt>
              <dd>{field.surface_ha.toFixed(2)} ha</dd>
              <dt>{it ? 'Gruppo' : 'Group'}</dt>
              <dd>{field.group}</dd>
              <dt>{it ? 'Gestione' : 'Farming protocol'}</dt>
              <dd>{field.farmingType}</dd>
              <dt>{it ? 'Coordinate' : 'Center'}</dt>
              <dd>
                {field.center[0].toFixed(4)}°, {field.center[1].toFixed(4)}°
              </dd>
              <dt>{it ? 'Precipitazioni 30d' : '30d rainfall'}</dt>
              <dd>{field.recentRainMm != null ? `${field.recentRainMm} mm` : '63.71 mm'}</dd>
            </dl>
          </div>
        )}

        {tab === 2 && (
          <div className="parcel-forecasts">
            <h3>{it ? 'Previsioni NASA POWER' : 'NASA POWER agro-weather'}</h3>
            <p className="subtle">
              {it
                ? 'Radiazione, temperatura e bilancio idrico sul baricentro del campo.'
                : 'Solar radiation, temperature anomalies and precipitation forecast.'}
            </p>
            {climate?.summary ? (
              <div className="parcel-climate-preview">
                <div>
                  <small>{it ? 'Precipitazioni annue' : 'Annual precipitation'}</small>
                  <b>{(climate.summary.precipitation ?? 650).toFixed(0)} mm</b>
                </div>
                <div>
                  <small>{it ? 'Temperatura estiva' : 'Summer mean temperature'}</small>
                  <b>{(climate.summary.temperature ?? 21.0).toFixed(1)} °C</b>
                </div>
              </div>
            ) : (
              <div className="parcel-climate-preview">
                <div>
                  <small>{it ? 'Temperatura attuale' : 'Air temperature'}</small>
                  <b>21.0 °C · 58% RH</b>
                </div>
                <div>
                  <small>{it ? 'Precipitazioni 30d' : 'Last 30 days rain'}</small>
                  <b>63.71 mm</b>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="parcel-files">
            <p className="subtle">
              {it
                ? 'Scarica i confini georeferenziati del campo.'
                : 'Export georeferenced parcel boundaries.'}
            </p>
            <button
              className="export-btn"
              onClick={() => {
                const geo = exportBoundaries([field]);
                const blob = new Blob([JSON.stringify(geo, null, 2)], {
                  type: 'application/geo+json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${field.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.geojson`;
                a.click();
              }}
            >
              <Download size={15} />
              {it ? 'Esporta GeoJSON' : 'Download GeoJSON'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
