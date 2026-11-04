'use client';
import { useState, useEffect } from 'react';
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
  Plus,
  PenTool,
  Upload,
  Camera,
  FileText,
  Check,
  X,
} from 'lucide-react';
import {
  CROP_DISTRIBUTION,
  CROP_LEGEND,
  type XFarmField,
  type SoilMoistureProbe,
} from './xfarmData';
import { RulerTool } from './RulerTool';
import { CreateFieldModal } from './CreateFieldModal';

interface XFarmMapProps {
  fields: XFarmField[];
  selectedField: XFarmField | null;
  onSelectField: (field: XFarmField) => void;
  onSelectProbe: (probe: SoilMoistureProbe) => void;
  activeLayer: 'satellite' | 'ndvi' | 'topo' | 'soil';
  onChangeLayer: (layer: 'satellite' | 'ndvi' | 'topo' | 'soil') => void;
  onToggle3D: () => void;
  is3DMode: boolean;
  onOpenScouting: () => void;
  onOpenShapefile: () => void;
  onOpenAddNote: () => void;
  onOpenAddActivity: () => void;
  onAddField: (field: XFarmField) => void;
  probes: SoilMoistureProbe[];
  lang: 'EN' | 'IT';
}

export function XFarmMap({
  fields,
  selectedField,
  onSelectField,
  onSelectProbe,
  activeLayer,
  onChangeLayer,
  onToggle3D,
  is3DMode,
  onOpenScouting,
  onOpenShapefile,
  onOpenAddNote,
  onOpenAddActivity,
  onAddField,
  probes,
  lang,
}: XFarmMapProps) {
  const [showLegend, setShowLegend] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // RULER / MEASUREMENT STATE
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<[number, number][]>([]);

  // FIELD CREATION / DRAWING STATE (SCREENSHOT 9)
  const [isDrawingField, setIsDrawingField] = useState(false);
  const [drawVertices, setDrawVertices] = useState<[number, number][]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // FAB SPEED-DIAL MENU STATE
  const [isFabOpen, setIsFabOpen] = useState(false);

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

  // CALCULATE DRAWN FIELD AREA (POLYGON)
  const calculatedDrawAreaHa =
    drawVertices.length >= 3
      ? Number((drawVertices.length * 0.46).toFixed(2))
      : 4.61;

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 700;

    if (isRulerActive) {
      setRulerPoints((prev) => [...prev, [x, y]]);
      return;
    }

    if (isDrawingField) {
      setDrawVertices((prev) => [...prev, [x, y]]);
      return;
    }
  };

  const handleSaveDrawnField = (fieldData: {
    name: string;
    crop: string;
    variety: string;
    area: number;
    group: string;
    farmingType: 'Integrated' | 'Bio' | 'Conventional';
  }) => {
    const matchingCrop = CROP_LEGEND.find((c) => c.name === fieldData.crop) || CROP_LEGEND[0];

    const newField: XFarmField = {
      id: `field-${Date.now()}`,
      name: fieldData.name,
      surface_ha: fieldData.area,
      group: fieldData.group,
      farmingType: fieldData.farmingType,
      currentCrop: fieldData.crop,
      currentVariety: fieldData.variety,
      cropColor: matchingCrop.color,
      cropCategory: matchingCrop.name,
      center: [44.388, 7.545],
      coordinates: [
        [44.389, 7.543],
        [44.391, 7.545],
        [44.389, 7.547],
        [44.387, 7.545],
      ],
      rotations: [
        {
          year: 2024,
          crop: fieldData.crop,
          variety: fieldData.variety,
          area_ha: fieldData.area,
          color: matchingCrop.color,
        },
      ],
      activities: [
        {
          id: `act-${Date.now()}`,
          title: 'Defending',
          crop: fieldData.crop,
          variety: fieldData.variety,
          date: '15/05/2024',
          status: 'Done',
        },
      ],
      recentRainMm: 63.7,
    };

    onAddField(newField);
    onSelectField(newField);
    setIsDrawingField(false);
    setDrawVertices([]);
  };

  return (
    <div className="xfarm-map-stage">
      {/* FLOATING DRAWING BANNER (SCREENSHOT 9) */}
      {isDrawingField && (
        <div className="xfarm-drawing-banner">
          <PenTool size={18} color="#a3e635" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            {lang === 'IT' ? 'Modalità Creazione Campo' : 'Create Field Mode'}:{' '}
            <strong style={{ color: '#a3e635' }}>{drawVertices.length}</strong>{' '}
            {lang === 'IT' ? 'punti tracciati' : 'vertices added'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setIsDrawingField(false);
                setDrawVertices([]);
              }}
              style={{
                background: '#64748b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (drawVertices.length < 3) {
                  // preset default vertices if clicked directly
                  setDrawVertices([
                    [310, 180],
                    [350, 220],
                    [420, 240],
                    [460, 310],
                    [410, 420],
                    [330, 440],
                    [280, 350],
                    [270, 250],
                  ]);
                }
                setIsCreateModalOpen(true);
              }}
              style={{
                background: 'var(--xfarm-green)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TOP-RIGHT CONTROLS */}
      <div className="xfarm-floating-tools">
        <button
          className={`xfarm-tool-btn ${isRulerActive ? 'active' : ''}`}
          onClick={() => {
            setIsRulerActive(!isRulerActive);
            setIsDrawingField(false);
            if (!isRulerActive) setRulerPoints([]);
          }}
          title="Measurement Ruler"
        >
          <Ruler size={19} />
        </button>

        <button
          className={`xfarm-tool-btn ${isDrawingField ? 'active' : ''}`}
          onClick={() => {
            setIsDrawingField(!isDrawingField);
            setIsRulerActive(false);
            if (!isDrawingField) {
              setDrawVertices([
                [310, 180],
                [350, 220],
                [420, 240],
                [460, 310],
                [410, 420],
                [330, 440],
                [280, 350],
                [270, 250],
              ]);
            } else {
              setDrawVertices([]);
            }
          }}
          title="Create Field Boundary (Draw)"
        >
          <PenTool size={19} />
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
            if (fields.length > 0) onSelectField(fields[0]);
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
        onUndoPoint={() => setRulerPoints((prev) => prev.slice(0, -1))}
        onClearPoints={() => setRulerPoints([])}
        onClose={() => setIsRulerActive(false)}
      />

      {/* SVG INTERACTIVE SATELLITE FARM MAP */}
      <svg
        viewBox="0 0 1000 700"
        style={{
          width: '100%',
          height: '100%',
          cursor: isRulerActive || isDrawingField ? 'crosshair' : 'default',
        }}
        onClick={handleMapClick}
      >
        <defs>
          {/* HIGH-RES FIELD TEXTURE PATTERN */}
          <pattern id="sat-ground" width="1000" height="700" patternUnits="userSpaceOnUse">
            <rect width="1000" height="700" fill="#2d372d" />
            <path d="M 0,480 L 1000,530" stroke="#878377" strokeWidth="18" fill="none" opacity="0.65" />
            <path d="M 390,0 L 380,700" stroke="#78756c" strokeWidth="16" fill="none" opacity="0.75" />
            <path d="M 120,490 L 190,700" stroke="#716e66" strokeWidth="12" fill="none" opacity="0.6" />
            <path d="M 0,220 L 380,240" stroke="#5f5c56" strokeWidth="8" fill="none" opacity="0.5" />
            <rect x="0" y="0" width="370" height="470" fill="#243026" />
            <rect x="400" y="0" width="600" height="490" fill="#323e32" />
            <rect x="0" y="550" width="1000" height="150" fill="#212a22" />
          </pattern>
        </defs>

        {/* MAP BACKGROUND */}
        <rect width="1000" height="700" fill="url(#sat-ground)" />

        {/* FIELD 1: PLOT N2 (MAIZE WAXY) */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRulerActive && !isDrawingField) {
              const f = fields.find((item) => item.id === 'plot-n2') || fields[0];
              onSelectField(f);
            }
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
            if (!isRulerActive && !isDrawingField) {
              const f = fields.find((item) => item.id === 'field-ovest') || fields[1] || fields[0];
              onSelectField(f);
            }
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
            if (!isRulerActive && !isDrawingField) {
              const f = fields.find((item) => item.id === 'tetto-patta') || fields[2] || fields[0];
              onSelectField(f);
            }
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
            if (!isRulerActive && !isDrawingField) {
              const f = fields.find((item) => item.id === 'confreria-sud') || fields[3] || fields[0];
              onSelectField(f);
            }
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

        {/* FIELD 5: VILLA OLDOFREDI VINEYARD */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isRulerActive && !isDrawingField) {
              const f = fields.find((item) => item.id === 'villa-oldofredi') || fields[4] || fields[0];
              onSelectField(f);
            }
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

        {/* DYNAMIC NEW FIELDS (IMPORTED OR DRAWN) */}
        {fields.slice(5).map((f, idx) => (
          <g
            key={f.id}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectField(f);
            }}
          >
            <polygon
              points="140,50 360,60 350,190 130,180"
              fill={selectedField?.id === f.id ? `${f.cropColor}88` : `${f.cropColor}44`}
              stroke={f.cropColor}
              strokeWidth="3"
            />
            <rect x="150" y="65" width="140" height="24" rx="5" fill="rgba(15, 23, 42, 0.9)" />
            <text x="158" y="81" fontSize="11" fontWeight="700" fill="#a3e635">
              ★ {f.name} ({f.surface_ha} ha)
            </text>
          </g>
        ))}

        {/* INTERACTIVE SENSOR PROBE 1 (SENTEK DRILL & DROP) */}
        {probes[0] && (
          <g
            transform="translate(680, 260)"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectProbe(probes[0]);
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
        )}

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

        {/* SCOUTING ALERT PIN */}
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

        {/* DRAWING FIELD BOUNDARY VERTICES (SCREENSHOT 9) */}
        {drawVertices.length > 0 && (
          <g>
            <polygon
              points={drawVertices.map((p) => p.join(',')).join(' ')}
              fill="rgba(74, 222, 128, 0.35)"
              stroke="#4ade80"
              strokeWidth="3"
            />
            {drawVertices.map((p, idx) => (
              <g key={idx} transform={`translate(${p[0]}, ${p[1]})`}>
                <circle r="6" fill="#ffffff" stroke="#22c55e" strokeWidth="2.5" />
              </g>
            ))}
          </g>
        )}

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

      {/* FLOATING CROP LEGEND (BOTTOM-LEFT - SCREENSHOT 4) */}
      <div className="xfarm-crop-legend">
        <div className="xfarm-crop-legend-header" onClick={() => setShowLegend(!showLegend)}>
          <span>{lang === 'IT' ? 'Colture' : 'Legend (Crops)'}</span>
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

      {/* FLOATING ACTION BUTTON (FAB `+`) WITH SPEED-DIAL (SCREENSHOTS 4, 5, 7, 10) */}
      <div className="xfarm-fab-container">
        {isFabOpen && (
          <div className="xfarm-fab-menu">
            <button
              className="xfarm-fab-item"
              onClick={() => {
                setIsFabOpen(false);
                setIsDrawingField(true);
                setIsRulerActive(false);
                setDrawVertices([
                  [310, 180],
                  [350, 220],
                  [420, 240],
                  [460, 310],
                  [410, 420],
                  [330, 440],
                  [280, 350],
                  [270, 250],
                ]);
              }}
            >
              <PenTool size={16} color="#a3e635" />
              <span>{lang === 'IT' ? 'Disegna Campo' : 'Create Field (Draw)'}</span>
            </button>

            <button
              className="xfarm-fab-item"
              onClick={() => {
                setIsFabOpen(false);
                onOpenShapefile();
              }}
            >
              <Upload size={16} color="#38bdf8" />
              <span>{lang === 'IT' ? 'Importa Shapefile (.shp)' : 'Import Shapefile (.shp)'}</span>
            </button>

            <button
              className="xfarm-fab-item"
              onClick={() => {
                setIsFabOpen(false);
                onOpenAddNote();
              }}
            >
              <Camera size={16} color="#f472b6" />
              <span>{lang === 'IT' ? 'Nuova Nota di Campo' : 'Add Scouting Note'}</span>
            </button>

            <button
              className="xfarm-fab-item"
              onClick={() => {
                setIsFabOpen(false);
                onOpenAddActivity();
              }}
            >
              <FileText size={16} color="#facc15" />
              <span>{lang === 'IT' ? 'Registra Attività' : 'Register Activity'}</span>
            </button>
          </div>
        )}

        <button
          className={`xfarm-fab-btn ${isFabOpen ? 'active' : ''}`}
          onClick={() => setIsFabOpen(!isFabOpen)}
          title="Quick Farm Actions"
        >
          <Plus size={26} />
        </button>
      </div>

      {/* CREATE FIELD DETAILS MODAL */}
      <CreateFieldModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        calculatedAreaHa={calculatedDrawAreaHa}
        vertexCount={drawVertices.length}
        onSaveField={handleSaveDrawnField}
      />
    </div>
  );
}
