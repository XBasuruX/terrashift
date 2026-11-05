'use client';
import { useState } from 'react';
import { Check, X, Camera, MapPin, AlertCircle } from 'lucide-react';
import { type XFarmField, type ScoutingNote } from './xfarmData';

interface AddNoteModalProps {
  isOpen: boolean;
  fields: XFarmField[];
  onClose: () => void;
  onAddNote: (note: ScoutingNote) => void;
}

export function AddNoteModal({ isOpen, fields, onClose, onAddNote }: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ScoutingNote['category']>('General');
  const [fieldName, setFieldName] = useState(fields[0].name);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const categoryColorMap: Record<ScoutingNote['category'], string> = {
    General: '#64748b',
    Disease: '#be185d',
    Parasite: '#ea580c',
    Water: '#0284c7',
    Pest: '#65a30d',
    Damage: '#7c3aed',
    Sanitation: '#0891b2',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newNote: ScoutingNote = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      category,
      categoryColor: categoryColorMap[category],
      date: new Date().toLocaleDateString('en-GB'),
      author: 'Local user',
      fieldName,
      lat: (fields.find(f=>f.name===fieldName) ?? fields[0]).center[0],
      lng: (fields.find(f=>f.name===fieldName) ?? fields[0]).center[1],
      description: description.trim() || 'Observed during field scouting round.',
    };

    onAddNote(newNote);
    onClose();
  };

  return (
    <div className="xfarm-modal-backdrop" onClick={onClose}>
      <div
        className="xfarm-dialog-card"
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
            <Camera size={18} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Add Scouting Note</h3>
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
              Note Category
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(['General', 'Disease', 'Parasite', 'Water', 'Pest', 'Damage'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: category === cat ? categoryColorMap[cat] : '#cbd5e1',
                    background: category === cat ? categoryColorMap[cat] : '#ffffff',
                    color: category === cat ? '#ffffff' : '#475569',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Botrytis symptoms on leaves"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Associated Field Parcel
            </label>
            <select
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
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
              {fields.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name} ({f.currentCrop})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Observations &amp; Recommended Action
            </label>
            <textarea
              rows={3}
              placeholder="Describe what was observed in the field..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
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
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
