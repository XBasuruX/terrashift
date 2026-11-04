'use client';
import { useState } from 'react';
import { Search, Grid, Clock, Folder, Check, FileCode, Layers, X, Upload } from 'lucide-react';

interface ShapefileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportField: (fieldName: string, cropName: string, areaHa: number) => void;
}

export function ShapefileModal({ isOpen, onClose, onImportField }: ShapefileModalProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'browse'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>('Field layout-tomato.shp');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const mockFiles = [
    {
      id: 'shp-1',
      name: 'Field layout-tomato.shp',
      date: '26/03/22',
      source: 'iPhone',
      crop: 'Tomato (Bio)',
      area: 5.10,
    },
    {
      id: 'shp-2',
      name: 'Plot-N2-boundary.shp',
      date: '14/04/23',
      source: 'Trimble GPS',
      crop: 'Maize (corn) WAXY',
      area: 4.80,
    },
    {
      id: 'shp-3',
      name: 'Vineyard-Oldofredi-2023.shp',
      date: '02/09/23',
      source: 'QGIS Export',
      crop: 'Vineyard (Nebbiolo)',
      area: 2.80,
    },
    {
      id: 'shp-4',
      name: 'Tetto-Patta-Soy.geojson',
      date: '18/05/23',
      source: 'Cloud Drive',
      crop: 'Soybean',
      area: 3.40,
    },
  ];

  const filteredFiles = mockFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAndImport = (file: typeof mockFiles[0]) => {
    setSelectedFile(file.name);
    setIsSuccess(true);
    setTimeout(() => {
      onImportField(file.name.replace('.shp', '').replace('.geojson', ''), file.crop, file.area);
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="xfarm-modal-backdrop" onClick={onClose}>
      <div
        className="xfarm-shp-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '380px',
          maxHeight: '620px',
          background: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
          border: '1px solid #cbd5e1',
          position: 'relative',
        }}
      >
        {/* iOS TOP STATUS / HEADER */}
        <div
          style={{
            padding: '16px 20px 10px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ width: '40px' }} />
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            {activeTab === 'recent' ? 'Recent' : 'Browse Files'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
              title="Toggle Grid View"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#2563eb',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div style={{ padding: '10px 16px 6px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f1f5f9',
              borderRadius: '10px',
              padding: '8px 12px',
            }}
          >
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '15px',
                width: '100%',
                color: '#0f172a',
              }}
            />
          </div>
        </div>

        {/* NOTIFICATION ON SUCCESS */}
        {isSuccess && (
          <div
            style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            Shapefile imported! Adding parcel to farm map...
          </div>
        )}

        {/* FILE LISTING */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {activeTab === 'recent' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                CAD &amp; GIS BOUNDARIES
              </div>

              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelectAndImport(file)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: selectedFile === file.name ? '#f8fafc' : 'transparent',
                    border: selectedFile === file.name ? '1px solid #94a3b8' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* SHP BADGE ICON (AS IN SCREENSHOT 8) */}
                  <div
                    style={{
                      width: '52px',
                      height: '62px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: '#64748b',
                        letterSpacing: '0.5px',
                        marginBottom: '3px',
                      }}
                    >
                      SHP
                    </span>
                    <Layers size={22} color="#475569" />
                  </div>

                  {/* FILE DETAILS */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {file.date} &middot; {file.source}
                    </div>
                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                      {file.crop} &middot; {file.area} ha
                    </div>
                  </div>
                </div>
              ))}

              {/* UPLOAD CUSTOM FILE DROP AREA */}
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
                onClick={() => {
                  const name = prompt('Enter parcel name to import:', 'Custom Boundary-Plot4.shp');
                  if (name) {
                    onImportField(name.replace('.shp', ''), 'Cover Crop (Bio)', 3.2);
                    onClose();
                  }
                }}
              >
                <Upload size={22} color="#64748b" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Upload Shapefile (.shp, .zip, .geojson)
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Drag &amp; drop or click to browse
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b' }}>
              <Folder size={44} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>iCloud Drive &middot; xFarm Data</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                All GIS boundary files synchronized
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM TAB BAR (IOS RECENT / BROWSE) */}
        <div
          style={{
            height: '56px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            background: '#fafafa',
          }}
        >
          <button
            onClick={() => setActiveTab('recent')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: activeTab === 'recent' ? '#2563eb' : '#94a3b8',
            }}
          >
            <Clock size={20} />
            <span style={{ fontSize: '10px', fontWeight: 600 }}>Recent</span>
          </button>

          <button
            onClick={() => setActiveTab('browse')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: activeTab === 'browse' ? '#2563eb' : '#94a3b8',
            }}
          >
            <Folder size={20} />
            <span style={{ fontSize: '10px', fontWeight: 600 }}>Browse</span>
          </button>
        </div>
      </div>
    </div>
  );
}
