'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Ruler,
  Layers,
  Crosshair,
  Globe2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Droplets,
  Tractor,
  AlertTriangle,
  CloudRain,
  Sun,
  Maximize2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  XFARM_FIELDS,
  XFARM_PROBES,
  CROP_DISTRIBUTION,
  CROP_LEGEND,
  type XFarmField,
  type SoilMoistureProbe,
} from './xfarmData';
import { RulerTool } from './RulerTool';

interface XFarmMapProps {
  selectedField: XFarmField | null;
  onSelectField: (field: XFarmField) => void;
  onSelectProbe: (probe: SoilMoistureProbe) => void;
  activeLayer: 'satellite' | 'ndvi' | 'topo' | 'soil';
  onChangeLayer: (layer: 'satellite' | 'ndvi' | 'topo' | 'soil') => void;
  onToggle3D: () => void;
  is3DMode: boolean;
  onOpenScouting: () => void;
}

export function XFarmMap({
  selectedField,
  onSelectField,
  onSelectProbe,
  activeLayer,
  onChangeLayer,
  onToggle3D,
  is3DMode,
  onOpenScouting,
}: XFarmMapProps) {
  const [showLegend, setShowLegend] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // RULER / MEASUREMENT STATE
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<[number, number][]>([]);

  // TRACTOR ANIMATION POSITION
  const [tractorProgress, setTractorProgress] = useState(0.35);

  useEffect(() => {
    const interval = setInterval(() => {
      setTractorProgress((prev) => (prev >= 0.95 ? 0.05 : prev + 0.01));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // CALCULATE DISTANCE FOR RULER
  const totalDistance = rulerPoints.length < 2 ? 0 : 201.0;
  const totalArea = rulerPoints.length >= 3 ? 0.48 : null;

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isRulerActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 700;
    setRulerPoints((prev) => [...prev, [x, y]]);
  };

  const handleUndoPoint = () => {
    setRulerPoints((prev) => prev.slice(0, -1));
  };

  const handleClearPoints = () => {
    setRulerPoints([]);
  };

  return (
    <div className="xfarm-map-stage">
      {/* FLOATING TOP-RIGHT CONTROLS */}
      <div className="xfarm-floating-tools">
        <button
          className={`xfarm-tool-btn ${isRulerActive ? 'active' : ''}`}
          onClick={() => {
            setIsRulerActive(!isRulerActive);
            if (!isRulerActive) setRulerPoints([]);
          }}
          title="Measurement Ruler"
        >
          <Ruler size={19} />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className={`xfarm-tool-btn ${showLayerMenu ? 'active' : ''}`}
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Map Imagery & Agro Layers"
          >
            <Layers size={19} />
          </button>

          {showLayerMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                padding: '8px',
                minWidth: '180px',
                zIndex: 100,
                border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', padding: '4px 8px' }}>
                MAP LAYERS
              </div>
              <button
                onClick={() => {
                  onChangeLayer('satellite');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'satellite' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'satellite' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🛰️ High-Res Satellite
              </button>
              <button
                onClick={() => {
                  onChangeLayer('ndvi');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'ndvi' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'ndvi' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🌱 Sentinel NDVI Heatmap
              </button>
              <button
                onClick={() => {
                  onChangeLayer('soil');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'soil' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'soil' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🌍 Regional Soil Classification
              </button>
            </div>
          )}
        </div>

        <button
          className="xfarm-tool-btn"
          onClick={() => {
            if (selectedField) {
              // center on selected field
            }
          }}
          title="Center on Farm"
        >
          <Crosshair size={19} />
        </button>

        <button
          className={`xfarm-tool-btn ${is3DMode ? 'active' : ''}`}
          onClick={onToggle3D}
          title="Toggle 3D Cesium Earth"
        >
          <Globe2 size={19} />
        </button>

        <button
          className="xfarm-tool-btn"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title="Voice Guidance & Audio Feedback"
        >
          {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
      </div>

      {/* RULER OVERLAY */}
      <RulerTool
        isActive={isRulerActive}
        points={rulerPoints}
        totalDistanceMeters={totalDistance}
        totalAreaHa={totalArea}
        onUndoPoint={handleUndoPoint}
        onClearPoints={handleClearPoints}
        onClose={() => setIsRulerActive(false)}
      />

      {/* SVG INTERACTIVE SATELLITE FARM MAP */}
      <svg
        viewBox="0 0 1000 700"
        style={{ width: '100%', height: '100%', cursor: isRulerActive ? 'crosshair' : 'default' }}
        onClick={handleMapClick}
      >
        <defs>
          {/* HIGH-RES FIELD TEXTURE PATTERN */}
          <pattern id="sat-ground" width="1000" height="700" patternUnits="userSpaceOnUse">
            <rect width="1000" height="700" fill="#2d372d" />
            {/* Roads & Farm tracks */}
            <path d="M 0,480 L 1000,530" stroke="#878377" strokeWidth="18" fill="none" opacity="0.65" />
            <path d="M 390,0 L 380,700" stroke="#78756c" strokeWidth="16" fill="none" opacity="0.75" />
            <path d="M 120,490 L 190,700" stroke="#716e66" strokeWidth="12" fill="none" opacity="0.6" />
            <path d="M 0,220 L 380,240" stroke="#5f5c56" strokeWidth="8" fill="none" opacity="0.5" />
            {/* Surrounding landscape texture */}
            <rect x="0" y="0" width="370" height="470" fill="#243026" />
            <rect x="400" y="0" width="600" height="490" fill="#323e32" />
            <rect x="0" y="550" width="1000" height="150" fill="#212a22" />
          </pattern>

          {/* CROP FILL TEXTURES */}
          <pattern id="tramline-pattern" width="20" height="700" patternUnits="userSpaceOnUse">
            <line x1="10" y1="0" x2="10" y2="700" stroke="#22c55e" strokeWidth="1.8" strokeDasharray="6,4" opacity="0.9" />
          </pattern>
        </defs>

        {/* MAP BACKGROUND */}
        <rect width="1000" height="700" fill="url(#sat-ground)" />

        {/* FIELD 1: PLOT N2 (MAIZE WAXY) */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRulerActive) onSelectField(XFARM_FIELDS[0]);
          }}
        >
          <polygon
            points="420,140 760,145 745,505 440,490"
            fill={selectedField?.id === 'plot-n2' ? '#eab30866' : '#eab30844'}
            stroke="#f59e0b"
            strokeWidth={selectedField?.id === 'plot-n2' ? '4' : '2.5'}
          />
          {/* Tramlines / Guidance Lines on Plot N2 */}
          <g opacity="0.85">
            <line x1="550" y1="145" x2="540" y2="495" stroke="#4ade80" strokeWidth="1.8" />
            <line x1="565" y1="145" x2="555" y2="495" stroke="#4ade80" strokeWidth="1.8" />
            <line x1="580" y1="145" x2="570" y2="495" stroke="#4ade80" strokeWidth="1.8" />
            <line x1="595" y1="145" x2="585" y2="495" stroke="#4ade80" strokeWidth="1.8" />
            <line x1="610" y1="145" x2="600" y2="495" stroke="#4ade80" strokeWidth="1.8" />
            <line x1="625" y1="145" x2="615" y2="495" stroke="#4ade80" strokeWidth="1.8" />
          </g>

          {/* ACTIVE TRACTOR WORKING ALONG TRAMLINE */}
          <g transform={`translate(${580 - tractorProgress * 10}, ${150 + tractorProgress * 330})`}>
            <circle r="16" fill="#15803d" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="4" textAnchor="middle" fontSize="13" fill="#ffffff">🚜</text>
            <rect x="22" y="-12" width="130" height="24" rx="4" fill="rgba(15, 23, 42, 0.9)" />
            <text x="28" y="4" fontSize="10.5" fontWeight="700" fill="#a3e635">
              JD 6175R · 6.0 km/h
            </text>
          </g>

          {/* FIELD LABEL */}
          <rect x="430" y="150" width="115" height="24" rx="5" fill="rgba(15, 23, 42, 0.85)" />
          <text x="438" y="166" fontSize="11" fontWeight="700" fill="#ffffff">
            🌾 Plot N2 (4.80 ha)
          </text>
        </g>

        {/* FIELD 2: FIELD OVEST (SOFT WHEAT) */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRulerActive) onSelectField(XFARM_FIELDS[1]);
          }}
        >
          <polygon
            points="140,200 370,210 365,470 120,460"
            fill={selectedField?.id === 'field-ovest' ? '#df9f3266' : '#df9f3244'}
            stroke="#f59e0b"
            strokeWidth={selectedField?.id === 'field-ovest' ? '4' : '2.5'}
          />
          <rect x="150" y="215" width="125" height="24" rx="5" fill="rgba(15, 23, 42, 0.85)" />
          <text x="158" y="231" fontSize="11" fontWeight="700" fill="#ffffff">
            🌾 Field OVEST (6.2 ha)
          </text>
        </g>

        {/* FIELD 3: TETTO PATTA (SOYBEAN) */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRulerActive) onSelectField(XFARM_FIELDS[2]);
          }}
        >
          <polygon
            points="770,150 970,155 960,490 760,480"
            fill={selectedField?.id === 'tetto-patta' ? '#65a30d66' : '#65a30d44'}
            stroke="#84cc16"
            strokeWidth={selectedField?.id === 'tetto-patta' ? '4' : '2.5'}
          />
          <rect x="780" y="165" width="115" height="24" rx="5" fill="rgba(15, 23, 42, 0.85)" />
          <text x="788" y="181" fontSize="11" fontWeight="700" fill="#ffffff">
            🌱 Tetto Patta (3.4 ha)
          </text>
        </g>

        {/* FIELD 4: CONFRERIA SUD (TOMATO) */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRulerActive) onSelectField(XFARM_FIELDS[3]);
          }}
        >
          <polygon
            points="240,515 375,520 360,680 180,670"
            fill={selectedField?.id === 'confreria-sud' ? '#dc262666' : '#dc262644'}
            stroke="#ef4444"
            strokeWidth={selectedField?.id === 'confreria-sud' ? '4' : '2.5'}
          />
          <rect x="235" y="530" width="130" height="24" rx="5" fill="rgba(15, 23, 42, 0.85)" />
          <text x="243" y="546" fontSize="11" fontWeight="700" fill="#ffffff">
            🍅 Confreria Sud (5.1 ha)
          </text>
        </g>

        {/* FIELD 5: VILLA OLDOFREDI VINEYARD (GRAPES) */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRulerActive) onSelectField(XFARM_FIELDS[4]);
          }}
        >
          <polygon
            points="420,520 730,535 710,685 410,670"
            fill={selectedField?.id === 'villa-oldofredi' ? '#8b5cf666' : '#8b5cf644'}
            stroke="#a855f7"
            strokeWidth={selectedField?.id === 'villa-oldofredi' ? '4' : '2.5'}
          />
          <rect x="430" y="540" width="135" height="24" rx="5" fill="rgba(15, 23, 42, 0.85)" />
          <text x="438" y="556" fontSize="11" fontWeight="700" fill="#ffffff">
            🍇 Oldofredi Vite (2.8 ha)
          </text>
        </g>

        {/* INTERACTIVE SENSOR PROBE 1 (SENTEK DRILL & DROP) */}
        <g
          transform="translate(680, 260)"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectProbe(XFARM_PROBES[0]);
          }}
        >
          <circle r="18" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="26" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7">
            <animate attributeName="r" values="20;32;20" dur="3s" repeatCount="indefinite" />
          </circle>
          <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">
            32%
          </text>
          <rect x="-35" y="24" width="70" height="18" rx="4" fill="rgba(15, 23, 42, 0.9)" />
          <text x="0" y="37" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#38bdf8">
            Sentek 60cm
          </text>
        </g>

        {/* INTERACTIVE RAIN GAUGE */}
        <g
          transform="translate(450, 420)"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            alert('Rain gauge sensor: 118mm recorded this season.');
          }}
        >
          <circle r="16" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">
            118
          </text>
          <text x="0" y="14" textAnchor="middle" fontSize="8" fill="#93c5fd">
            mm
          </text>
        </g>

        {/* INTERACTIVE WEATHER STATION BADGE */}
        <g
          transform="translate(415, 190)"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            alert('Agro-meteorology: 21°C air temp, 58% humidity.');
          }}
        >
          <circle r="16" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">
            21°
          </text>
        </g>

        {/* SCOUTING ALERT PIN (BOTRYTIS CINEREA) */}
        <g
          transform="translate(620, 180)"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenScouting();
          }}
        >
          <circle r="14" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#ffffff">
            ⚠️
          </text>
        </g>

        {/* RULER DRAWING PATH & POINTS */}
        {rulerPoints.length > 0 && (
          <g>
            {rulerPoints.length > 1 && (
              <polyline
                points={rulerPoints.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke="#ec4899"
                strokeWidth="3.5"
                strokeDasharray="6,4"
              />
            )}
            {rulerPoints.map((p, idx) => (
              <g key={idx} transform={`translate(${p[0]}, ${p[1]})`}>
                <circle r="8" fill="#ffffff" stroke="#ec4899" strokeWidth="3" />
                <text x="0" y="-12" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">
                  P{idx + 1}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      {/* FLOATING CROP LEGEND (BOTTOM-LEFT) */}
      <div className="xfarm-crop-legend">
        <div className="xfarm-crop-legend-header" onClick={() => setShowLegend(!showLegend)}>
          <span>Colture (Crops)</span>
          {showLegend ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>

        {showLegend && (
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {CROP_LEGEND.map((c) => (
              <div key={c.name} className="xfarm-legend-item">
                <span className="xfarm-legend-dot" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM CROP DISTRIBUTION CHIPS STRIP */}
      <div className="xfarm-crop-strip">
        {CROP_DISTRIBUTION.map((item) => (
          <div key={item.name} className="xfarm-crop-chip">
            <span style={{ fontSize: '14px' }}>{item.emoji}</span>
            <span style={{ color: item.color }}>{item.name}</span>
            <span style={{ color: '#ffffff', opacity: 0.9 }}>{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
