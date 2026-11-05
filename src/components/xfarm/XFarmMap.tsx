'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Ruler,
  Layers,
  Crosshair,
  Globe2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  PenTool,
  Upload,
  Camera,
  FileText,
  Check,
  X,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import {
  CROP_DISTRIBUTION,
  CROP_LEGEND,
  type XFarmField,
  type SoilMoistureProbe,
} from './xfarmData';
import { RulerTool } from './RulerTool';
import { CreateFieldModal } from './CreateFieldModal';

export type MapImageryLayer =
  | 'satellite'
  | 'snazzy'
  | 'hybrid'
  | 'regional'
  | 'plot-n2'
  | 'ortho'
  | 'ndvi';

interface XFarmMapProps {
  fields: XFarmField[];
  selectedField: XFarmField | null;
  onSelectField: (field: XFarmField) => void;
  onSelectProbe: (probe: SoilMoistureProbe) => void;
  activeLayer?: MapImageryLayer;
  onChangeLayer?: (layer: MapImageryLayer) => void;
  onToggle3D?: () => void;
  is3DMode?: boolean;
  onOpenScouting?: () => void;
  onOpenShapefile?: () => void;
  onOpenAddNote?: () => void;
  onOpenAddActivity?: () => void;
  onAddField?: (field: XFarmField) => void;
  probes?: SoilMoistureProbe[];
  lang?: 'EN' | 'IT';
  initialMode?: 'browse' | 'draw' | 'measure';
  onBack?: () => void;
}

export function XFarmMap({
  fields = [],
  selectedField = null,
  onSelectField = () => {},
  onSelectProbe = () => {},
  activeLayer: externalLayer,
  onChangeLayer: externalSetLayer,
  onToggle3D = () => {},
  is3DMode = false,
  onOpenScouting = () => {},
  onOpenShapefile = () => {},
  onOpenAddNote = () => {},
  onOpenAddActivity = () => {},
  onAddField = () => {},
  probes = [],
  lang = 'EN',
  initialMode = 'browse',
  onBack,
}: XFarmMapProps) {
  const [internalLayer, setInternalLayer] = useState<MapImageryLayer>('satellite');
  const activeLayer = externalLayer || internalLayer;
  const setLayer = (l: MapImageryLayer) => {
    if (externalSetLayer) externalSetLayer(l);
    else setInternalLayer(l);
  };

  const [showLegend, setShowLegend] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ZOOM & PAN STATE
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // RULER / MEASUREMENT STATE
  const [isRulerActive, setIsRulerActive] = useState(initialMode === 'measure');
  const [rulerPoints, setRulerPoints] = useState<[number, number][]>([]);

  // FIELD CREATION / DRAWING STATE (SCREENSHOT 9)
  const [isDrawingField, setIsDrawingField] = useState(initialMode === 'draw');
  const [drawVertices, setDrawVertices] = useState<[number, number][]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // FAB SPEED-DIAL MENU STATE
  const [isFabOpen, setIsFabOpen] = useState(false);

  // TRACTOR ANIMATION POSITION
  const [tractorProgress, setTractorProgress] = useState(0.35);

  useEffect(() => {
    const interval = setInterval(() => {
      setTractorProgress((prev) => (prev >= 0.95 ? 0.05 : prev + 0.012));
    }, 350);
    return () => clearInterval(interval);
  }, []);

  // Sync with selected field
  useEffect(() => {
    if (selectedField?.id === 'plot-n2') {
      // Auto highlight Plot N2
    }
  }, [selectedField]);

  // CALCULATE DISTANCE FOR RULER
  const totalDistance = rulerPoints.length < 2 ? 0 : 201.0;
  const totalArea = rulerPoints.length >= 3 ? 0.48 : null;

  // CALCULATE DRAWN FIELD AREA (POLYGON)
  const calculatedDrawAreaHa =
    drawVertices.length >= 3 ? Number((drawVertices.length * 0.46).toFixed(2)) : 4.61;

  // MAP CLICK HANDLER
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging.current) return;
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRulerActive || isDrawingField) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
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

    if (onAddField) onAddField(newField);
    onSelectField(newField);
    setIsDrawingField(false);
    setDrawVertices([]);
  };

  // Determine current high-resolution photographic or cartographic basemap
  const getBasemapUrl = () => {
    switch (activeLayer) {
      case 'snazzy':
        return '/images/snazzy-map-cuneo.svg';
      case 'ndvi':
        return '/images/xfarm-ndvi-hd.jpg';
      case 'regional':
        return '/images/xfarm-satellite-regional-hd.jpg';
      case 'plot-n2':
        return '/images/xfarm-plot-n2-hd.jpg';
      case 'ortho':
        return '/data/cuneo-ortho.webp';
      case 'hybrid':
      case 'satellite':
      default:
        return '/images/xfarm-satellite-desktop-hd.jpg';
    }
  };

  return (
    <div
      className="xfarm-map-stage"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#1a221b',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* FLOATING DRAWING BANNER (SCREENSHOT 9) */}
      {isDrawingField && (
        <div className="xfarm-drawing-banner">
          <PenTool size={18} color="#a3e635" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            {lang === 'IT' ? 'Modalità Creazione Campo' : 'Create Field Mode'}:{' '}
            <strong style={{ color: '#a3e635' }}>{drawVertices.length}</strong>{' '}
            {lang === 'IT' ? 'punti tracciati' : 'vertices placed'}
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

      {/* FLOATING ZOOM / RESET CONTROLS (LEFT-TOP) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'rgba(22, 28, 24, 0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            padding: '6px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom in"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            padding: '6px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Zoom out"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleResetView}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a3e635',
            padding: '6px',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Reset zoom & pan"
        >
          <RotateCcw size={15} />
        </button>
      </div>

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

        {/* MAP IMAGERY LAYER SELECTOR */}
        <div style={{ position: 'relative' }}>
          <button
            className={`xfarm-tool-btn ${showLayerMenu ? 'active' : ''}`}
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Satellite & Agro Layers"
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
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                padding: '8px',
                minWidth: '220px',
                zIndex: 100,
                border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', padding: '4px 8px', letterSpacing: '0.4px' }}>
                HIGH-RESOLUTION SATELLITE
              </div>

              <button
                onClick={() => {
                  setLayer('satellite');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'satellite' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'satellite' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>🛰️</span>
                <span>Satellite HD (Aerial Orthophoto)</span>
              </button>

              <button
                onClick={() => {
                  setLayer('snazzy');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'snazzy' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'snazzy' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>🗺️</span>
                <span>Snazzy Maps (Vector Cadastre & Roads)</span>
              </button>

              <button
                onClick={() => {
                  setLayer('hybrid');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'hybrid' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'hybrid' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>🌐</span>
                <span>Hybrid (Satellite + Snazzy Overlay)</span>
              </button>

              <button
                onClick={() => {
                  setLayer('regional');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'regional' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'regional' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>🗺️</span>
                <span>Regional Farm Mosaic (Cuneo)</span>
              </button>

              <button
                onClick={() => {
                  setLayer('plot-n2');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'plot-n2' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'plot-n2' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>🔍</span>
                <span>Plot N2 Close-Up Aerial</span>
              </button>

              <button
                onClick={() => {
                  setLayer('ortho');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'ortho' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'ortho' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>🌍</span>
                <span>Arpa Orthophoto 3.5K</span>
              </button>

              <button
                onClick={() => {
                  setLayer('ndvi');
                  setShowLayerMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeLayer === 'ndvi' ? '#dcfce7' : 'transparent',
                  color: activeLayer === 'ndvi' ? '#15803d' : '#1e293b',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>🌱</span>
                <span>Sentinel NDVI False-Color</span>
              </button>
            </div>
          )}
        </div>

        <button
          className="xfarm-tool-btn"
          onClick={() => {
            if (fields.length > 0) onSelectField(fields[0]);
            handleResetView();
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
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: '100%',
          height: '100%',
          cursor: isRulerActive || isDrawingField ? 'crosshair' : isDragging.current ? 'grabbing' : 'grab',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '50% 50%',
          transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
        }}
        onClick={handleMapClick}
      >
        <defs>
          <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* 1. PHOTOREALISTIC SATELLITE BASEMAP (HIGH QUALITY) */}
        <image
          href={getBasemapUrl()}
          x="0"
          y="0"
          width="1000"
          height="700"
          preserveAspectRatio="none"
          style={{
            filter: 'contrast(1.08) brightness(1.02) saturate(1.12)',
          }}
        />

        {/* HYBRID OVERLAY: Snazzy Cartographic Roads, Rivers & Town Badges */}
        {activeLayer === 'hybrid' && (
          <image
            href="/images/snazzy-overlay.svg"
            x="0"
            y="0"
            width="1000"
            height="700"
            preserveAspectRatio="none"
            opacity="0.95"
          />
        )}

        {/* 2. FIELD 1: PLOT N2 (MAIZE WAXY) */}
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
            fill={selectedField?.id === 'plot-n2' ? '#eab30844' : '#eab30822'}
            stroke="#f59e0b"
            strokeWidth={selectedField?.id === 'plot-n2' ? '3.5' : '2'}
            filter={selectedField?.id === 'plot-n2' ? 'url(#glow-selected)' : undefined}
          />

          {/* LAND AREA DETAILS: Vertex measurement pins & edge distances */}
          {selectedField?.id === 'plot-n2' && (
            <g>
              <circle cx="420" cy="140" r="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="760" cy="145" r="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="745" cy="505" r="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="440" cy="490" r="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />

              <rect x="560" y="130" width="65" height="18" rx="4" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" strokeWidth="1" />
              <text x="592" y="143" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">201.00m</text>

              <rect x="735" y="315" width="65" height="18" rx="4" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" strokeWidth="1" />
              <text x="767" y="328" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">340.00m</text>

              <rect x="565" y="490" width="65" height="18" rx="4" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" strokeWidth="1" />
              <text x="597" y="503" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">295.00m</text>

              <rect x="390" y="305" width="65" height="18" rx="4" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" strokeWidth="1" />
              <text x="422" y="318" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">180.00m</text>
            </g>
          )}

          {/* Animated Tramlines / Guidance Lines on Plot N2 */}
          <g opacity="0.9">
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

          <rect x="430" y="150" width="125" height="24" rx="5" fill="rgba(15, 23, 42, 0.9)" />
          <text x="438" y="166" fontSize="11" fontWeight="700" fill="#ffffff">
            🌾 Plot N2 (4.80 ha)
          </text>
        </g>

        {/* 3. FIELD 2: FIELD OVEST (SOFT WHEAT) */}
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
            fill={selectedField?.id === 'field-ovest' ? '#df9f3255' : '#df9f3222'}
            stroke="#f59e0b"
            strokeWidth={selectedField?.id === 'field-ovest' ? '3.5' : '2'}
            filter={selectedField?.id === 'field-ovest' ? 'url(#glow-selected)' : undefined}
          />
          <rect x="150" y="215" width="130" height="24" rx="5" fill="rgba(15, 23, 42, 0.9)" />
          <text x="158" y="231" fontSize="11" fontWeight="700" fill="#ffffff">
            🌾 Field OVEST (6.2 ha)
          </text>
        </g>

        {/* 4. FIELD 3: TETTO PATTA (SOYBEAN) */}
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
            fill={selectedField?.id === 'tetto-patta' ? '#65a30d55' : '#65a30d22'}
            stroke="#84cc16"
            strokeWidth={selectedField?.id === 'tetto-patta' ? '3.5' : '2'}
          />
          <rect x="780" y="165" width="125" height="24" rx="5" fill="rgba(15, 23, 42, 0.9)" />
          <text x="788" y="181" fontSize="11" fontWeight="700" fill="#ffffff">
            🌱 Tetto Patta (3.4 ha)
          </text>
        </g>

        {/* 5. FIELD 4: CONFRERIA SUD (TOMATO) */}
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
            fill={selectedField?.id === 'confreria-sud' ? '#dc262655' : '#dc262622'}
            stroke="#ef4444"
            strokeWidth={selectedField?.id === 'confreria-sud' ? '3.5' : '2'}
          />
          <rect x="235" y="530" width="135" height="24" rx="5" fill="rgba(15, 23, 42, 0.9)" />
          <text x="243" y="546" fontSize="11" fontWeight="700" fill="#ffffff">
            🍅 Confreria Sud (5.1 ha)
          </text>
        </g>

        {/* 6. FIELD 5: VILLA OLDOFREDI VINEYARD */}
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
            fill={selectedField?.id === 'villa-oldofredi' ? '#8b5cf655' : '#8b5cf622'}
            stroke="#a855f7"
            strokeWidth={selectedField?.id === 'villa-oldofredi' ? '3.5' : '2'}
          />
          <rect x="430" y="540" width="140" height="24" rx="5" fill="rgba(15, 23, 42, 0.9)" />
          <text x="438" y="556" fontSize="11" fontWeight="700" fill="#ffffff">
            🍇 Oldofredi Vite (2.8 ha)
          </text>
        </g>

        {/* DYNAMIC NEW FIELDS (IMPORTED OR DRAWN) */}
        {fields.slice(5).map((f) => (
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

      {/* FLOATING DETAILED LAND AREA PREVIEW HUD */}
      {selectedField && !isRulerActive && !isDrawingField && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            left: '75px',
            zIndex: 30,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '12px 16px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxWidth: '340px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ✦ Determined Land Area
            </span>
            <button
              onClick={() => onSelectField(null as any)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}
              title="Close detail preview"
            >
              ✕
            </button>
          </div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
            {selectedField.name}
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#cbd5e1' }}>
            {selectedField.currentCrop} ({selectedField.currentVariety || 'Selected Variety'}) &middot; {selectedField.farmingType}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Surface</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>{selectedField.surface_ha.toFixed(2)} ha</div>
              <div style={{ fontSize: '9.5px', color: '#64748b' }}>{(selectedField.surface_ha * 10000).toLocaleString()} m²</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Soil Moisture</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>32.4% Optimal</div>
              <div style={{ fontSize: '9.5px', color: '#64748b' }}>Sentek 60cm probe</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const el = document.querySelector('.parcel-detail');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                flex: 1,
                background: '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Full Operations Dossier →
            </button>
            <button
              onClick={() => setLayer(activeLayer === 'snazzy' ? 'satellite' : 'snazzy')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {activeLayer === 'snazzy' ? '🛰️ View Sat' : '🗺️ View Snazzy'}
            </button>
          </div>
        </div>
      )}

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
            <div
              style={{
                fontSize: '9px',
                color: '#94a3b8',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              Google &middot; Imagery &copy;2023 CNES / Airbus, Maxar Technologies
            </div>
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
        groups={['NORTH', 'Conti', 'SOUTH', 'EAST']}
        onSaveField={handleSaveDrawnField}
      />
    </div>
  );
}
