'use client';
import {
  Map,
  Layers,
  Tractor,
  Droplets,
  Sprout,
  ClipboardList,
  Ruler,
  Satellite,
  FlaskConical,
  FileText,
  Sliders,
} from 'lucide-react';

export type XFarmTab =
  | 'fields'
  | 'map'
  | 'fleet'
  | 'sensors'
  | 'crops'
  | 'scouting'
  | 'measure'
  | 'satellite'
  | 'climate'
  | 'brief';

interface XFarmSidebarProps {
  activeTab: XFarmTab;
  onSelectTab: (tab: XFarmTab) => void;
  isFleetOpen: boolean;
  onToggleFleet: () => void;
}

export function XFarmSidebar({
  activeTab,
  onSelectTab,
  isFleetOpen,
  onToggleFleet,
}: XFarmSidebarProps) {
  const tabs = [
    { id: 'fields', label: 'Fields', icon: Layers, title: 'Field gallery' },
    { id: 'map', label: 'Map', icon: Map, title: 'Farm Map & Fields' },
    { id: 'fleet', label: 'Fleet', icon: Tractor, title: 'Machinery & Telemetry', badge: 'Active' },
    { id: 'sensors', label: 'Sensors', icon: Droplets, title: 'Soil Moisture & Weather' },
    { id: 'crops', label: 'Crops', icon: Sprout, title: 'Crop Rotations & Parcels' },
    { id: 'scouting', label: 'Notes', icon: ClipboardList, title: 'Field Scouting & Reports' },
    { id: 'measure', label: 'Measure', icon: Ruler, title: 'Ruler & Area Calculation' },
  ];

  const scienceTabs = [
    { id: 'satellite', label: 'NASA EO', icon: Satellite, title: 'NASA Earth Observation' },
    { id: 'climate', label: 'Climate', icon: FlaskConical, title: 'Climate Stress Lab' },
    { id: 'brief', label: 'Report', icon: FileText, title: 'Decision Brief' },
  ];

  return (
    <aside className="xfarm-dock">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id || (tab.id === 'fleet' && isFleetOpen);
        return (
          <button
            key={tab.id}
            className={`xfarm-dock-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (tab.id === 'fleet') {
                onToggleFleet();
              } else {
                onSelectTab(tab.id as XFarmTab);
              }
            }}
            title={tab.title}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}

      <div className="xfarm-dock-divider" />

      {scienceTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`xfarm-dock-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id as XFarmTab)}
            title={tab.title}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
