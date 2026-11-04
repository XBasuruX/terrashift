'use client';
import { Bell, AlertTriangle, CheckCircle, Droplets, Tractor, X, CloudRain } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectField: (fieldId: string) => void;
  onOpenSensors: () => void;
}

export function NotificationsModal({
  isOpen,
  onClose,
  onSelectField,
  onOpenSensors,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      icon: Droplets,
      color: '#38bdf8',
      title: 'Low Soil Moisture Alert (6.30%)',
      desc: 'Sentek 60cm probe at Plot N2 detects shallow moisture below 7% threshold. Irrigation recommended.',
      time: '15m ago',
      action: 'Check Sensors',
      handler: onOpenSensors,
    },
    {
      id: 'n2',
      icon: AlertTriangle,
      color: '#f43f5e',
      title: 'Pest Threshold Alert: Botrytis cinerea',
      desc: 'Disease scouting note submitted in Field OVEST. High humidity favorable for fungal spread.',
      time: '2h ago',
      action: 'Open Field OVEST',
      handler: () => onSelectField('field-ovest'),
    },
    {
      id: 'n3',
      icon: Tractor,
      color: '#a3e635',
      title: 'Guidance Complete: JD 6175R',
      desc: 'Seeding run finished in Plot N2 (4.80 ha covered, avg speed 6.0 km/h, 25.5 L/h fuel).',
      time: '4h ago',
      action: 'View Plot N2',
      handler: () => onSelectField('plot-n2'),
    },
    {
      id: 'n4',
      icon: CloudRain,
      color: '#60a5fa',
      title: 'Rainfall Inflow Registered (14.2 mm)',
      desc: 'Automatic rain gauge recorded 14.2 mm in 4 hours. Available soil water replenished.',
      time: '1d ago',
      action: 'View Climate',
      handler: onOpenSensors,
    },
    {
      id: 'n5',
      icon: CheckCircle,
      color: '#22c55e',
      title: 'Crop Rotation Feasible (Score 84/100)',
      desc: 'NASA POWER model evaluated 2024 Barley -> Maize rotation with positive water balance.',
      time: '2d ago',
      action: 'View Rotation',
      handler: () => onSelectField('plot-n2'),
    },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '60px',
        right: '20px',
        width: '380px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        border: '1px solid #cbd5e1',
        zIndex: 150,
        overflow: 'hidden',
        animation: 'slideDown 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'var(--xfarm-green)',
          color: '#ffffff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
            Field Notifications & Alerts (94)
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '8px 0' }}>
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div
              key={notif.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${notif.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Icon size={16} color={notif.color} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{notif.title}</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{notif.time}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                  {notif.desc}
                </p>
                <button
                  onClick={() => {
                    notif.handler();
                    onClose();
                  }}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--xfarm-green)',
                    cursor: 'pointer',
                  }}
                >
                  {notif.action} →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '10px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '12px',
            color: 'var(--xfarm-green)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
}
