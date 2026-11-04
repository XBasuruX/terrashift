'use client';
import { Droplets, BatteryCharging, X, Compass, BarChart2, ShieldCheck } from 'lucide-react';
import type { SoilMoistureProbe } from './xfarmData';

interface SensorDrawerProps {
  probe: SoilMoistureProbe | null;
  onClose: () => void;
  onViewDetails: (probe: SoilMoistureProbe) => void;
}

export function SensorDrawer({ probe, onClose, onViewDetails }: SensorDrawerProps) {
  if (!probe) return null;

  return (
    <div className="xfarm-sensor-drawer">
      <div className="xfarm-sensor-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="xfarm-sensor-title">Multilevel Soil Moisture</h3>
            <span
              style={{
                fontSize: '11px',
                background: '#dcfce7',
                color: '#15803d',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <BatteryCharging size={13} /> {probe.batteryPercent}%
            </span>
          </div>
          <p className="xfarm-sensor-meta">
            Sensor | {probe.name} &middot; Field: <strong>{probe.fieldName}</strong>
          </p>
          <p className="xfarm-sensor-meta" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            Code: {probe.code}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            padding: '8px',
            cursor: 'pointer',
            color: '#64748b',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', margin: '8px 0 4px 0' }}>
        Detection of {probe.lastDetection}
      </div>

      {/* 6 DEPTH METRIC CARDS */}
      <div className="xfarm-depth-grid">
        {probe.depths.map((d) => (
          <div key={d.depthCm} className="xfarm-depth-card">
            <div className="xfarm-depth-percentage">{d.moisturePercent.toFixed(2)}%</div>
            <div className="xfarm-depth-range">
              <span>▼ {d.minRange}</span>
              <span>▲ {d.maxRange}</span>
            </div>
            <div className="xfarm-depth-label">{d.depthLabel}</div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              Depth: {d.depthCm} cm
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <ShieldCheck size={14} color="#16a34a" />
          <span>Capacitance probe calibrated against soil loam/clay curve</span>
        </div>

        <div className="xfarm-sensor-actions">
          <button className="xfarm-btn-secondary" onClick={() => onViewDetails(probe)}>
            <BarChart2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Details & Trends
          </button>
          <button
            className="xfarm-btn-primary"
            onClick={() => alert(`Navigating to coordinates: ${probe.lat.toFixed(4)}, ${probe.lng.toFixed(4)}`)}
          >
            <Compass size={14} />
            Directions
          </button>
        </div>
      </div>
    </div>
  );
}
