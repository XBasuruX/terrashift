'use client';
import { Tractor, Gauge, Fuel, Activity, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { XFARM_MACHINERY, type XFarmMachinery } from './xfarmData';

interface FleetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMachine: (machine: XFarmMachinery) => void;
  selectedMachineId: string | null;
}

export function FleetDrawer({
  isOpen,
  onClose,
  onSelectMachine,
  selectedMachineId,
}: FleetDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="xfarm-fleet-panel">
      <div className="xfarm-panel-header">
        <h3>
          <Tractor size={18} color="#a3e635" />
          <span>Fleet & Machinery ({XFARM_MACHINERY.length})</span>
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.2)', fontSize: '11px', color: '#94a3b8' }}>
        Live telemetry streaming via ISOBUS / JDLink connection
      </div>

      <div className="xfarm-fleet-list">
        {XFARM_MACHINERY.map((m) => {
          const isSelected = selectedMachineId === m.id;
          const isTractor = m.type === 'Tractor';
          const isWorking = m.status === 'In work';

          return (
            <div
              key={m.id}
              className="xfarm-fleet-row"
              style={{
                background: isSelected ? 'rgba(85, 122, 83, 0.3)' : undefined,
                borderLeft: isWorking ? '3px solid #a3e635' : '3px solid transparent',
              }}
              onClick={() => onSelectMachine(m)}
            >
              <div
                className="xfarm-machine-icon"
                style={{
                  background: isWorking ? '#2a422e' : '#1e293b',
                  borderColor: isWorking ? '#a3e635' : 'rgba(255,255,255,0.2)',
                }}
              >
                <Tractor size={20} color={isWorking ? '#a3e635' : '#94a3b8'} />
              </div>

              <div className="xfarm-machine-info">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p className="xfarm-machine-title">{m.model}</p>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      background: isWorking ? '#14532d' : '#334155',
                      color: isWorking ? '#4ade80' : '#cbd5e1',
                    }}
                  >
                    {m.status}
                  </span>
                </div>

                <p className="xfarm-machine-sub">{m.brand} &middot; {m.type}</p>

                {isTractor && (
                  <div className="xfarm-telemetry-pill" style={{ marginTop: '6px' }}>
                    <span className="xfarm-telemetry-val">
                      <Gauge size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {m.speedKmH ? `${m.speedKmH.toFixed(1)} km/h` : '0.0 km/h'}
                    </span>
                    <span className="xfarm-telemetry-val">
                      <Fuel size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {m.fuelLH ? `${m.fuelLH.toFixed(1)} L/h` : '-'}
                    </span>
                    {m.fuelPercent && (
                      <span className="xfarm-telemetry-val" style={{ color: '#4ade80' }}>
                        Tank: {m.fuelPercent}%
                      </span>
                    )}
                  </div>
                )}

                {m.activeField && (
                  <div style={{ fontSize: '10px', color: '#86efac', marginTop: '4px' }}>
                    📍 Field: {m.activeField}
                  </div>
                )}
              </div>

              <ChevronRight size={14} color="#64748b" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
