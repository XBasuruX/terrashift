'use client';
import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { CROP_LEGEND } from './xfarmData';

interface CreateFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatedAreaHa: number;
  vertexCount: number;
  groups: string[];
  onSaveField: (fieldData: {
    name: string;
    crop: string;
    variety: string;
    area: number;
    group: string;
    farmingType: 'Integrated' | 'Bio' | 'Conventional';
  }) => void;
}

export function CreateFieldModal({
  isOpen,
  onClose,
  calculatedAreaHa,
  vertexCount, groups,
  onSaveField,
}: CreateFieldModalProps) {
  const [fieldName, setFieldName] = useState('New Field Parcel');
  const [selectedCrop, setSelectedCrop] = useState(CROP_LEGEND[0].name);
  const [variety, setVariety] = useState('Pioneer P0937');
  const [group, setGroup] = useState(groups[0] ?? 'Conti');
  const [farmingType, setFarmingType] = useState<'Integrated' | 'Bio' | 'Conventional'>('Bio');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;
    onSaveField({
      name: fieldName,
      crop: selectedCrop,
      variety,
      area: calculatedAreaHa,
      group,
      farmingType,
    });
    onClose();
  };

  return (
    <div className="xfarm-modal-backdrop" onClick={onClose}>
      <div
        className="xfarm-create-field-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '420px',
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* SAGE GREEN TOP BAR (LIKE SCREENSHOT 9) */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Create Field</h3>
          </div>

        </div>

        {/* DETAILS FORM */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* CALCULATED SURFACE BANNER */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                Boundary Geometry
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                {vertexCount > 0 ? `${vertexCount} points pinned on map` : 'Preset geometry loaded'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>
                {calculatedAreaHa.toFixed(2)} ha
              </div>
              <div style={{ fontSize: '10px', color: '#166534' }}>Total Area</div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Field Name
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Group / Sector
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              >
                {groups.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Farming Protocol
              </label>
              <select
                value={farmingType}
                onChange={(e) => setFarmingType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              >
                <option value="Bio">Bio (Organic)</option>
                <option value="Integrated">Integrated</option>
                <option value="Conventional">Conventional</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Crop Selection
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              {CROP_LEGEND.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Cultivar / Variety
            </label>
            <input
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder="e.g. WAXY LG 30703 or SOLEHIO"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          {/* ACTION BUTTONS (LIKE SCREENSHOT 9) */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#64748b',
                color: '#ffffff',
                fontSize: '14px',
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
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--xfarm-green)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Check size={16} />
              Save Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
