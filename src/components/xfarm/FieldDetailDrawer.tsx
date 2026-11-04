'use client';
import { useState } from 'react';
import {
  X,
  Edit2,
  Calendar,
  CloudRain,
  Sprout,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import type { XFarmField } from './xfarmData';
import { AddActivityModal } from './AddActivityModal';

interface FieldDetailDrawerProps {
  field: XFarmField | null;
  onClose: () => void;
  onOpenRotationStudio?: () => void;
  lang?: 'EN' | 'IT';
  onAddActivityToField?: (fieldId: string, activity: any) => void;
}

export function FieldDetailDrawer({
  field,
  onClose,
  onOpenRotationStudio,
  lang = 'EN',
  onAddActivityToField,
}: FieldDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'crop' | 'activities' | 'notes' | 'forecasts'>('crop');
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);

  if (!field) return null;

  const isIt = lang === 'IT';

  return (
    <div className="xfarm-field-drawer">
      {/* TOP HEADER */}
      <div className="xfarm-field-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2>{field.name}</h2>
          <Edit2 size={14} style={{ cursor: 'pointer', opacity: 0.8 }} />
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* SUB BAR WITH METADATA (MATCHING SCREENSHOTS 7 & 10) */}
      <div className="xfarm-field-subbar">
        <div>
          <span style={{ opacity: 0.7 }}>{isIt ? 'Area totale: ' : 'Surface: '}</span>
          <strong>{field.surface_ha.toFixed(2)} ha</strong>
        </div>
        <div>
          <span style={{ opacity: 0.7 }}>{isIt ? 'Gruppo: ' : 'Group: '}</span>
          <strong>{field.group}</strong>
        </div>
        <div>
          <span style={{ opacity: 0.7 }}>{isIt ? 'Tipo: ' : 'Type: '}</span>
          <strong>{field.farmingType}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CloudRain size={13} color="#93c5fd" />
          <span>{field.recentRainMm} mm (30d)</span>
        </div>
      </div>

      {/* TABS (MATCHING SCREENSHOT 7 & 10) */}
      <div className="xfarm-tab-bar">
        <button
          className={`xfarm-tab-btn ${activeTab === 'crop' ? 'active' : ''}`}
          onClick={() => setActiveTab('crop')}
        >
          {isIt ? 'Coltura' : 'Crop'}
        </button>
        <button
          className={`xfarm-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          {isIt ? `Attività (${field.activities.length})` : `Activities (${field.activities.length})`}
        </button>
        <button
          className={`xfarm-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          {isIt ? 'Note & Foto' : 'Notes'}
        </button>
        <button
          className={`xfarm-tab-btn ${activeTab === 'forecasts' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasts')}
        >
          {isIt ? 'Previsionali' : 'Forecasts'}
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="xfarm-tab-content">
        {/* CROP ROTATIONS TAB (MATCHING SCREENSHOT 7 & 10) */}
        {activeTab === 'crop' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                {isIt ? 'Colture Annuali' : 'Yearly Crop Rotation'}
              </h4>
              {onOpenRotationStudio && (
                <button
                  onClick={onOpenRotationStudio}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#334155',
                  }}
                >
                  {isIt ? 'Analizza in Studio →' : 'Analyze in Studio →'}
                </button>
              )}
            </div>

            {/* THREE COLUMNS / CARDS FOR 2024, 2023, 2022 (AS IN SCREENSHOT 7 & 10) */}
            {field.rotations.map((r) => (
              <div key={r.year} className="xfarm-rotation-card" style={{ borderLeftColor: r.color }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>{r.year}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    {r.area_ha.toFixed(2)} ha
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: r.color,
                      border: '1px solid #94a3b8',
                    }}
                  />
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{r.crop}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>({r.variety})</span>
                </div>

                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      alert(`${isIt ? 'Modifica coltura' : 'Edit crop'}: ${r.crop} (${r.year})`);
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#557a53',
                      cursor: 'pointer',
                    }}
                  >
                    {isIt ? '+ Aggiungi Coltura' : '+ Add Crop'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITIES TAB (MATCHING SCREENSHOT 6 & 10) */}
        {activeTab === 'activities' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                {isIt ? 'Attività in Campo' : 'Field Operations'}
              </h4>
              <button
                onClick={() => setIsAddActivityOpen(true)}
                style={{
                  background: 'var(--xfarm-green)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isIt ? 'Registra Attività' : '+ New activity'}
              </button>
            </div>

            {field.activities.map((a) => (
              <div key={a.id} className="xfarm-activity-item">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                      {isIt
                        ? a.title === 'Defending'
                          ? 'Difesa'
                          : a.title === 'Irrigating'
                          ? 'Irrigazione'
                          : a.title === 'Harvesting'
                          ? 'Raccolta'
                          : a.title
                        : a.title}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>&middot; {a.crop}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {isIt ? 'Data: ' : 'Date: '}
                    {a.date}
                  </div>
                </div>

                <span className={`xfarm-status-pill ${a.status.toLowerCase()}`}>
                  {isIt
                    ? a.status === 'Done'
                      ? 'Fatto'
                      : 'Scaduta'
                    : a.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* SCOUTING NOTES TAB */}
        {activeTab === 'notes' && (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b' }}>
              {isIt ? 'Osservazioni in Campo' : 'Field Observations'}
            </h4>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>Botrytis cinerea 1st detection</strong>
                <span style={{ fontSize: '10px', background: '#fce7f3', color: '#be185d', padding: '2px 6px', borderRadius: '10px' }}>
                  Disease
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 6px 0' }}>21/08/2023 &middot; Mario Rossi</div>
              <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>
                First symptoms detected in northern sector. Leaf spot symptoms under control with biological copper treatment.
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>Water stagnation</strong>
                <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '10px' }}>
                  Water
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 6px 0' }}>08/05/2023 &middot; Mario Rossi</div>
              <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>
                Ponding observed in lowest furrow after heavy spring rain. Drainage ditch cleared.
              </p>
            </div>
          </div>
        )}

        {/* FORECASTS TAB */}
        {activeTab === 'forecasts' && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b' }}>
              {isIt ? 'Previsioni Meteo NASA POWER' : 'NASA POWER 7-Day Forecast'}
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Interpolated agrometeorology for lat {field.center[0].toFixed(3)}°, lng {field.center[1].toFixed(3)}°
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Thu</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>21°C</div>
                <div style={{ fontSize: '10px', color: '#16a34a' }}>0 mm</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Fri</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>19°C</div>
                <div style={{ fontSize: '10px', color: '#0284c7' }}>4.2 mm</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Sat</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>22°C</div>
                <div style={{ fontSize: '10px', color: '#16a34a' }}>0 mm</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Sun</div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>23°C</div>
                <div style={{ fontSize: '10px', color: '#16a34a' }}>0 mm</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <button
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'var(--xfarm-green)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsAddActivityOpen(true)}
        title="Add new activity"
      >
        <Plus size={24} />
      </button>

      {/* ADD ACTIVITY MODAL */}
      <AddActivityModal
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        fieldName={field.name}
        cropName={field.currentCrop}
        onAddActivity={(act) => {
          if (onAddActivityToField) {
            onAddActivityToField(field.id, act);
          } else {
            field.activities.unshift({
              id: `act-${Date.now()}`,
              ...act,
            });
          }
        }}
      />
    </div>
  );
}
