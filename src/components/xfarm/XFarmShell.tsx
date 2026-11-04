'use client';
import { useState } from 'react';
import './xfarm.css';
import { XFarmHeader } from './XFarmHeader';
import { XFarmSidebar, type XFarmTab } from './XFarmSidebar';
import { XFarmMap } from './XFarmMap';
import { FleetDrawer } from './FleetDrawer';
import { SensorDrawer } from './SensorDrawer';
import { FieldDetailDrawer } from './FieldDetailDrawer';
import { ScoutingNotes } from './ScoutingNotes';
import { NotificationsModal } from './NotificationsModal';
import {
  XFARM_FIELDS,
  XFARM_PROBES,
  type XFarmField,
  type XFarmMachinery,
  type SoilMoistureProbe,
  type ScoutingNote,
} from './xfarmData';
import { RotationStudio } from '../RotationStudio';
import { ClimateLab } from '../ClimateLab';
import { Evidence } from '../Evidence';
import { DecisionBrief } from '../DecisionBrief';
import { MapExplorer } from '../MapExplorer';
import { FarmConfig } from '../FarmConfig';

export function XFarmShell() {
  const [activeTab, setActiveTab] = useState<XFarmTab>('map');
  const [activePilot, setActivePilot] = useState<string>('Cuneo / Piedmont Farm');
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'ndvi' | 'topo' | 'soil'>('satellite');

  // INTERACTIVE OVERLAYS & DRAWERS
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<XFarmMachinery | null>(null);
  const [selectedField, setSelectedField] = useState<XFarmField | null>(XFARM_FIELDS[0]);
  const [selectedProbe, setSelectedProbe] = useState<SoilMoistureProbe | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScoutingOpen, setIsScoutingOpen] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  // SEARCH HANDLER
  const handleSearch = (query: string) => {
    const q = query.toLowerCase();
    const found = XFARM_FIELDS.find(
      (f) => f.name.toLowerCase().includes(q) || f.currentCrop.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedField(found);
      setActiveTab('map');
    } else {
      alert(`Search for "${query}" completed. Matching field parcel highlighted.`);
    }
  };

  return (
    <div className="xfarm-shell">
      {/* 1. TOP HEADER BAR */}
      <XFarmHeader
        onSearch={handleSearch}
        activePilot={activePilot}
        onSelectPilot={(pilot) => {
          setActivePilot(pilot);
          if (pilot.includes('Anuradhapura')) {
            setIs3DMode(true);
          } else {
            setIs3DMode(false);
          }
        }}
        onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        isNotificationsOpen={isNotificationsOpen}
      />

      {/* 2. MAIN BODY (LEFT DOCK + STAGE) */}
      <div className="xfarm-body">
        {/* LEFT DOCK */}
        <XFarmSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'scouting') setIsScoutingOpen(true);
            if (tab === 'sensors') setSelectedProbe(XFARM_PROBES[0]);
            if (tab === 'map') {
              setIsScoutingOpen(false);
            }
          }}
          isFleetOpen={isFleetOpen}
          onToggleFleet={() => setIsFleetOpen(!isFleetOpen)}
        />

        {/* MAP STAGE (DEFAULT VIEW) */}
        {activeTab === 'map' && !is3DMode && (
          <XFarmMap
            selectedField={selectedField}
            onSelectField={(field) => {
              setSelectedField(field);
              setSelectedProbe(null);
            }}
            onSelectProbe={(probe) => {
              setSelectedProbe(probe);
              setSelectedField(null);
            }}
            activeLayer={activeLayer}
            onChangeLayer={setActiveLayer}
            onToggle3D={() => setIs3DMode(true)}
            is3DMode={is3DMode}
            onOpenScouting={() => setIsScoutingOpen(true)}
          />
        )}

        {/* 3D CESIUM GLOBE MODE */}
        {is3DMode && (
          <div style={{ flex: 1, position: 'relative', height: '100%', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 40,
                background: 'rgba(22, 28, 24, 0.9)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700 }}>🌐 Cesium 3D Earth Navigation</span>
              <button
                onClick={() => setIs3DMode(false)}
                style={{
                  background: 'var(--xfarm-green)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Return to 2D Parcels
              </button>
            </div>
            <MapExplorer large />
          </div>
        )}

        {/* CROP ROTATIONS TAB (ROTATION STUDIO) */}
        {activeTab === 'crops' && (
          <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                    Crop Rotations & Agronomic Optimization
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Multi-season sequence planning with water balance and Pareto frontier screening
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  style={{
                    background: 'var(--xfarm-green)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Farm Map
                </button>
              </div>
              <RotationStudio />
            </div>
          </div>
        )}

        {/* CLIMATE LAB TAB */}
        {activeTab === 'climate' && (
          <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                    Climate Stress Lab & Historical Weather
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Simulate extreme drought and temperature anomalies against NASA POWER records
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  style={{
                    background: 'var(--xfarm-green)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Farm Map
                </button>
              </div>
              <ClimateLab />
            </div>
          </div>
        )}

        {/* SATELLITE & NASA EO TAB */}
        {activeTab === 'satellite' && (
          <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                    Earth Observation Evidence & Data Provenance
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    MODIS NDVI, Sentinel-2 10m bands, and NASA MERRA-2 meteorological verification
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  style={{
                    background: 'var(--xfarm-green)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Farm Map
                </button>
              </div>
              <Evidence />
            </div>
          </div>
        )}

        {/* DECISION BRIEF TAB */}
        {activeTab === 'brief' && (
          <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '24px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                    Agronomic Decision Brief (PDF Export)
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  style={{
                    background: 'var(--xfarm-green)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Farm Map
                </button>
              </div>
              <DecisionBrief />
            </div>
          </div>
        )}

        {/* FLEET MACHINERY SLIDE-OUT DRAWER */}
        <FleetDrawer
          isOpen={isFleetOpen}
          onClose={() => setIsFleetOpen(false)}
          onSelectMachine={(m) => {
            setSelectedMachine(m);
            if (m.activeField) {
              const f = XFARM_FIELDS.find((field) => field.name.includes(m.activeField!));
              if (f) setSelectedField(f);
            }
          }}
          selectedMachineId={selectedMachine?.id || null}
        />

        {/* FIELD DETAIL & ROTATION TIMELINE DRAWER */}
        <FieldDetailDrawer
          field={selectedField}
          onClose={() => setSelectedField(null)}
          onOpenRotationStudio={() => setActiveTab('crops')}
        />

        {/* MULTILEVEL SENSOR BOTTOM DRAWER */}
        <SensorDrawer
          probe={selectedProbe}
          onClose={() => setSelectedProbe(null)}
          onViewDetails={() => setActiveTab('satellite')}
        />

        {/* SCOUTING NOTES VIEW */}
        <ScoutingNotes
          isOpen={isScoutingOpen}
          onClose={() => setIsScoutingOpen(false)}
          onSelectNote={(note) => {
            setIsScoutingOpen(false);
            const f = XFARM_FIELDS.find((field) => field.name.includes(note.fieldName));
            if (f) setSelectedField(f);
          }}
        />

        {/* NOTIFICATIONS MODAL */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onSelectField={(id) => {
            const f = XFARM_FIELDS.find((field) => field.id === id);
            if (f) setSelectedField(f);
          }}
          onOpenSensors={() => setSelectedProbe(XFARM_PROBES[0])}
        />
      </div>
    </div>
  );
}
