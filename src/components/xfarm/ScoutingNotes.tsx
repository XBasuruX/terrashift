'use client';
import { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Plus,
  Filter,
  Camera,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { type ScoutingNote } from './xfarmData';

interface ScoutingNotesProps {
  isOpen: boolean;
  notes: ScoutingNote[];
  onClose: () => void;
  onSelectNote: (note: ScoutingNote) => void;
}

export function ScoutingNotes({ isOpen, notes, onClose, onSelectNote }: ScoutingNotesProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<'All' | '1mo' | '6mo' | '1yr'>('All');
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  if (!isOpen) return null;

  const categories = [
    { label: 'All', color: '#1e293b' },
    { label: 'General', color: '#64748b' },
    { label: 'Disease', color: '#f472b6' },
    { label: 'Parasite', color: '#fb923c' },
    { label: 'Water', color: '#38bdf8' },
    { label: 'Pest', color: '#a3e635' },
    { label: 'Damage', color: '#c084fc' },
  ];

  const filteredNotes = notes.filter((n) => {
    if (activeCategory !== 'All' && n.category !== activeCategory) return false;
    if (timeFilter === 'All') return true;
    const [day,month,year] = n.date.split('/').map(Number);
    const since = new Date();
    since.setMonth(since.getMonth() - ({ '1mo':1, '6mo':6, '1yr':12 }[timeFilter]));
    return new Date(year,month-1,day) >= since;
  });

  return (
    <div className="xfarm-scouting-view">
      {/* HEADER */}
      <div
        style={{
          height: '52px',
          background: 'var(--xfarm-green)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            Field Scouting & Notes ({filteredNotes.length})
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* CATEGORY FILTER STRIP */}
      <div className="xfarm-category-strip">
        {categories.map((cat) => (
          <button
            key={cat.label}
            className={`xfarm-category-chip ${activeCategory === cat.label ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.label)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* SUB-FILTER: TIME & VIEW TOGGLE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['All', '1mo', '6mo', '1yr'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                background: timeFilter === t ? '#334155' : '#ffffff',
                color: timeFilter === t ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {t === 'All' ? 'All time' : t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
          <button
            onClick={() => setViewMode('visual')}
            style={{
              padding: '4px 12px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              background: viewMode === 'visual' ? '#ffffff' : 'transparent',
              color: viewMode === 'visual' ? '#0f172a' : '#64748b',
              boxShadow: viewMode === 'visual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
            }}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '4px 12px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              background: viewMode === 'list' ? '#ffffff' : 'transparent',
              color: viewMode === 'list' ? '#0f172a' : '#64748b',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
            }}
          >
            List
          </button>
        </div>
      </div>

      {/* NOTES GRID (VISUAL CARDS) */}
      <div className={'xfarm-notes-grid '+(viewMode==='list'?'notes-list':'')}>
        {filteredNotes.map((note) => (
          <div key={note.id} className="xfarm-note-card" onClick={() => onSelectNote(note)}>
            {/* THUMBNAIL */}
            <div className="xfarm-note-thumb">
              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: 0, opacity: 0.6 }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#475569" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#1e293b" />
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#ffffff',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  <MapPin size={18} color="#ffffff" />
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                  {note.lat.toFixed(4)}°, {note.lng.toFixed(4)}°
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="xfarm-note-body">
              <div className="xfarm-note-meta">
                Created by <strong>{note.author}</strong> &middot; {note.date}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: `${note.categoryColor}25`,
                    color: note.categoryColor,
                    border: `1px solid ${note.categoryColor}60`,
                  }}
                >
                  {note.category}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{note.fieldName}</span>
              </div>
              <h3 className="xfarm-note-title">{note.title}</h3>
              <p className="xfarm-note-desc">{note.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
