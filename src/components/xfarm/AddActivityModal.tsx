'use client';
import { useState } from 'react';
import { Check, X, Calendar, Wrench } from 'lucide-react';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  cropName: string;
  onAddActivity: (activity: {
    title: 'Defending' | 'Irrigating' | 'Harvesting' | 'Fertilizing' | 'Tillage';
    crop: string;
    variety: string;
    date: string;
    status: 'Done' | 'Expired' | 'Planned';
  }) => void;
}

export function AddActivityModal({
  isOpen,
  onClose,
  fieldName,
  cropName,
  onAddActivity,
}: AddActivityModalProps) {
  const [title, setTitle] = useState<'Defending' | 'Irrigating' | 'Harvesting' | 'Fertilizing' | 'Tillage'>('Defending');
  const [date, setDate] = useState('2024-05-15');
  const [status, setStatus] = useState<'Done' | 'Expired' | 'Planned'>('Done');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddActivity({
      title,
      crop: cropName,
      variety: 'Commercial',
      date: date.split('-').reverse().join('/'),
      status,
    });
    onClose();
  };

  return (
    <div className="xfarm-modal-backdrop" onClick={onClose}>
      <div
        className="xfarm-dialog-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '380px',
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1',
        }}
      >
        <div
          style={{
            background: 'var(--xfarm-green)',
            color: '#ffffff',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Register Activity &middot; {fieldName}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Operation Type
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value as any)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="Defending">Defending (Crop Protection)</option>
              <option value="Irrigating">Irrigating (Watering)</option>
              <option value="Harvesting">Harvesting (Yield Collection)</option>
              <option value="Fertilizing">Fertilizing (Soil Nutrition)</option>
              <option value="Tillage">Tillage &amp; Seedbed Prep</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Execution Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Status
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['Done', 'Expired', 'Planned'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: status === s ? 'var(--xfarm-green)' : '#cbd5e1',
                    background: status === s ? '#dcfce7' : '#ffffff',
                    color: status === s ? '#15803d' : '#64748b',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: '8px',
                border: 'none',
                background: '#94a3b8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--xfarm-green)',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Check size={16} />
              Save Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
