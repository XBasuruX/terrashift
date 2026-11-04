'use client';
import { Ruler, Undo2, Trash2, X, Plus, Check } from 'lucide-react';

interface RulerToolProps {
  isActive: boolean;
  points: [number, number][];
  totalDistanceMeters: number;
  totalAreaHa: number | null;
  onUndoPoint: () => void;
  onClearPoints: () => void;
  onClose: () => void;
}

export function RulerTool({
  isActive,
  points,
  totalDistanceMeters,
  totalAreaHa,
  onUndoPoint,
  onClearPoints,
  onClose,
}: RulerToolProps) {
  if (!isActive) return null;

  return (
    <div className="xfarm-ruler-overlay">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Ruler size={18} color="#f472b6" />
        <span>Ruler Mode</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="xfarm-distance-badge">
          {totalDistanceMeters.toFixed(2)} m
        </span>
        {totalAreaHa !== null && totalAreaHa > 0 && (
          <span
            style={{
              background: '#38bdf8',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            {totalAreaHa.toFixed(2)} ha
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onUndoPoint}
          disabled={points.length === 0}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: points.length === 0 ? 'not-allowed' : 'pointer',
            opacity: points.length === 0 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
          title="Undo last point"
        >
          <Undo2 size={13} />
          Undo
        </button>

        <button
          onClick={onClearPoints}
          disabled={points.length === 0}
          style={{
            background: 'rgba(239, 68, 68, 0.25)',
            border: 'none',
            color: '#fca5a5',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: points.length === 0 ? 'not-allowed' : 'pointer',
            opacity: points.length === 0 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
          title="Clear all points"
        >
          <Trash2 size={13} />
          Clear
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Exit Ruler Mode"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
