'use client';
import { useState } from 'react';
import './xfarm.css';
import './parcels.css';
import { XFarmHeader, type ViewportMode } from './XFarmHeader';
import { XFarmSidebar, type XFarmTab } from './XFarmSidebar';
import { XFarmMap } from './XFarmMap';
import { FleetDrawer } from './FleetDrawer';
import { SensorDrawer } from './SensorDrawer';
import { FieldDetailDrawer } from './FieldDetailDrawer';
import { ScoutingNotes } from './ScoutingNotes';
import { NotificationsModal } from './NotificationsModal';
import { ShapefileModal } from './ShapefileModal';
import { AddNoteModal } from './AddNoteModal';
import { AddActivityModal } from './AddActivityModal';
import {
  XFARM_FIELDS,
  XFARM_PROBES,
  XFARM_SCOUTING_NOTES,
  CROP_LEGEND,
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
import { Shell } from '../Shell';
import { useTerra } from '@/lib/store';

export function XFarmShell() {
  const [activeTab, setActiveTab] = useState<XFarmTab>('map');
  const [activePilot, setActivePilot] = useState<string>('Cuneo / Piedmont Farm');
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'regional' | 'plot-n2' | 'ortho' | 'ndvi'>('satellite');
  const [lang, setLang] = useState<'EN' | 'IT'>('EN');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [showTerraShiftSuite, setShowTerraShiftSuite] = useState(false);

  // DYNAMIC DATA STATE
  const [fields, setFields] = useState<XFarmField[]>(XFARM_FIELDS);
  const [probes, setProbes] = useState<SoilMoistureProbe[]>(XFARM_PROBES);
  const [notes, setNotes] = useState<ScoutingNote[]>(XFARM_SCOUTING_NOTES);

  // INTERACTIVE OVERLAYS & DRAWERS
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<XFarmMachinery | null>(null);
  const [selectedField, setSelectedField] = useState<XFarmField | null>(null);
  const [selectedProbe, setSelectedProbe] = useState<SoilMoistureProbe | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScoutingOpen, setIsScoutingOpen] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  // MODALS
  const [isShapefileOpen, setIsShapefileOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);

  // SEARCH HANDLER
  const handleSearch = (query: string) => {
    const q = query.toLowerCase();
    const found = fields.find(
      (f) => f.name.toLowerCase().includes(q) || f.currentCrop.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedField(found);
      setActiveTab('map');
    } else {
      alert(`Search for "${query}" completed. Matching field parcel highlighted.`);
    }
  };

  // IMPORT SHAPEFILE HANDLER
  const handleImportShapefile = (fieldName: string, cropName: string, areaHa: number) => {
    const matchingCrop = CROP_LEGEND.find((c) => cropName.includes(c.name)) || CROP_LEGEND[0];

    const importedField: XFarmField = {
      id: `shp-field-${Date.now()}`,
      name: fieldName,
      surface_ha: areaHa,
      group: 'Conti',
      farmingType: 'Bio',
      currentCrop: cropName,
      currentVariety: 'Certified Organic',
      cropColor: matchingCrop.color,
      cropCategory: matchingCrop.name,
      center: [44.387, 7.544],
      coordinates: [
        [44.388, 7.542],
        [44.39, 7.544],
        [44.388, 7.546],
        [44.386, 7.544],
      ],
      rotations: [
        {
          year: 2024,
          crop: cropName,
          variety: 'Certified Organic',
          area_ha: areaHa,
          color: matchingCrop.color,
        },
      ],
      activities: [
        {
          id: `act-${Date.now()}`,
          title: 'Defending',
          crop: cropName,
          variety: 'Organic',
          date: '28/05/2024',
          status: 'Done',
        },
      ],
      recentRainMm: 63.7,
    };

    setFields((prev) => [importedField, ...prev]);
    setSelectedField(importedField);
    setActiveTab('map');
  };

  // ADD SCOUTING NOTE HANDLER
  const handleAddNote = (newNote: ScoutingNote) => {
    setNotes((prev) => [newNote, ...prev]);
    setIsScoutingOpen(true);
  };

  // ADD ACTIVITY HANDLER
  const handleAddActivity = (fieldId: string, activity: any) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            activities: [
              {
                id: `act-${Date.now()}`,
                ...activity,
              },
              ...f.activities,
            ],
          };
        }
        return f;
      })
    );
  };

  // TOGGLE TO FULL TERRASHIFT NASA SUITE
  if (showTerraShiftSuite) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <button
          onClick={() => setShowTerraShiftSuite(false)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '24px',
            zIndex: 9999,
            background: 'var(--xfarm-green)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          ← Return to xFarm Platform
        </button>
        <Shell />
      </div>
    );
  }

  // INNER APPLICATION CONTENT
  const renderAppContent = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#121915',
      }}
    >
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
        lang={lang}
        onChangeLang={setLang}
        viewportMode={viewportMode}
        onChangeViewport={setViewportMode}
      />

      {/* 2. MAIN BODY (LEFT DOCK + STAGE) */}
      <div className="xfarm-body" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* LEFT DOCK */}
        <XFarmSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'scouting') setIsScoutingOpen(true);
            if (tab === 'sensors') setSelectedProbe(probes[0]);
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
            fields={fields}
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
            onOpenShapefile={() => setIsShapefileOpen(true)}
            onOpenAddNote={() => setIsAddNoteOpen(true)}
            onOpenAddActivity={() => {
              if (selectedField) setIsAddActivityOpen(true);
              else alert('Select a field parcel to register an activity.');
            }}
            onAddField={(newField) => setFields((prev) => [newField, ...prev])}
            probes={probes}
            lang={lang}
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
                Return to 2D High-Res Parcels
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
                    Crop Rotations &amp; Agronomic Optimization
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
                    Climate Stress Lab &amp; Historical Weather
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
                    Earth Observation Evidence &amp; Data Provenance
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
              const f = fields.find((field) => field.name.includes(m.activeField!));
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
          lang={lang}
          onAddActivityToField={handleAddActivity}
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
          notes={notes}
          onClose={() => setIsScoutingOpen(false)}
          onSelectNote={(note) => {
            setIsScoutingOpen(false);
            const f = fields.find((field) => field.name.includes(note.fieldName));
            if (f) setSelectedField(f);
          }}
        />

        {/* NOTIFICATIONS MODAL */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onSelectField={(id) => {
            const f = fields.find((field) => field.id === id);
            if (f) setSelectedField(f);
          }}
          onOpenSensors={() => setSelectedProbe(probes[0])}
        />

        {/* SHAPEFILE IMPORT MODAL (SCREENSHOT 8) */}
        <ShapefileModal
          isOpen={isShapefileOpen}
          onClose={() => setIsShapefileOpen(false)}
          onImportField={handleImportShapefile}
        />

        {/* ADD NOTE MODAL (SCREENSHOT 5) */}
        <AddNoteModal
          isOpen={isAddNoteOpen}
          fields={fields}
          onClose={() => setIsAddNoteOpen(false)}
          onAddNote={handleAddNote}
        />

        {/* ADD ACTIVITY MODAL (SCREENSHOT 6 & 10) */}
        {selectedField && (
          <AddActivityModal
            isOpen={isAddActivityOpen}
            onClose={() => setIsAddActivityOpen(false)}
            fieldName={selectedField.name}
            cropName={selectedField.currentCrop}
            onAddActivity={(act) => handleAddActivity(selectedField.id, act)}
          />
        )}
      </div>
    </div>
  );

  // VIEWPORT FRAME SWITCHER (DESKTOP, TABLET IPAD, MOBILE IPHONE)
  if (viewportMode === 'tablet') {
    return (
      <div className="xfarm-device-wrapper">
        <div className="xfarm-tablet-frame">
          <div className="xfarm-tablet-bezel">{renderAppContent()}</div>
        </div>
      </div>
    );
  }

  if (viewportMode === 'mobile') {
    return (
      <div className="xfarm-device-wrapper">
        <div className="xfarm-mobile-frame">
          <div className="xfarm-dynamic-island" />
          <div className="xfarm-mobile-bezel">{renderAppContent()}</div>
        </div>
      </div>
    );
  }

  return <div className="xfarm-shell">{renderAppContent()}</div>;
}

// Export FieldOperations for Shell.tsx backward compatibility
export function FieldOperations() {
  return <XFarmShell />;
}
