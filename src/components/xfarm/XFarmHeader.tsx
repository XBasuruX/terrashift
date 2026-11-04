'use client';
import { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Globe,
  ChevronDown,
  Building2,
  CheckCircle,
  AlertTriangle,
  X,
  Droplets,
} from 'lucide-react';

interface XFarmHeaderProps {
  onSearch: (query: string) => void;
  activePilot: string;
  onSelectPilot: (pilot: string) => void;
  onOpenNotifications: () => void;
  isNotificationsOpen: boolean;
}

export function XFarmHeader({
  onSearch,
  activePilot,
  onSelectPilot,
  onOpenNotifications,
  isNotificationsOpen,
}: XFarmHeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [lang, setLang] = useState<'EN' | 'IT' | 'LK'>('EN');
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <header className="xfarm-header">
      {/* LEFT: LOGO & SEARCH */}
      <div className="xfarm-header-left">
        <div className="xfarm-logo" title="xFarm Agricultural Management Platform">
          <span className="xfarm-logo-chevrons">&gt;&gt;</span>
          <span>XFARM</span>
          <span className="xfarm-brand-badge">TerraShift</span>
        </div>

        <form onSubmit={handleSearchSubmit} className="xfarm-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search a field, parcel or location..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </form>
      </div>

      {/* RIGHT: WEATHER, NOTIFICATIONS, ORG, USER */}
      <div className="xfarm-header-right">
        {/* LIVE WEATHER WIDGET */}
        <div className="xfarm-weather-pill" title="Live Field Weather Station">
          <Sun size={15} color="#fde047" />
          <span>20°C</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <Droplets size={13} color="#93c5fd" />
          <span>63.7mm (30d)</span>
        </div>

        {/* NOTIFICATION BUTTON */}
        <button
          className="xfarm-notif-btn"
          onClick={onOpenNotifications}
          title="Field Alerts & Sensor Events"
        >
          <Bell size={18} />
          <span className="xfarm-badge-count">94</span>
        </button>

        {/* ORGANIZATION / PILOT SELECTOR */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <Building2 size={14} />
            <span>{activePilot}</span>
            <ChevronDown size={14} />
          </button>

          {showOrgDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#ffffff',
                color: '#1e293b',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                padding: '6px',
                minWidth: '220px',
                zIndex: 200,
                border: '1px solid #cbd5e1',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Switch Farm Pilot
              </div>
              <button
                onClick={() => {
                  onSelectPilot('Cuneo / Piedmont Farm');
                  setShowOrgDropdown(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: activePilot.includes('Cuneo') ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                🇮🇹 Azienda Agricola Cuneo (EU Pilot)
              </button>
              <button
                onClick={() => {
                  onSelectPilot('Anuradhapura Smallholder');
                  setShowOrgDropdown(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: activePilot.includes('Anuradhapura') ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                🇱🇰 Anuradhapura Pilot (Dry Zone)
              </button>
            </div>
          )}
        </div>

        {/* LANGUAGE SWITCHER */}
        <button
          onClick={() => setLang(lang === 'EN' ? 'IT' : lang === 'IT' ? 'LK' : 'EN')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 8px',
          }}
          title="Switch Language"
        >
          <Globe size={15} />
          <span>{lang}</span>
        </button>

        {/* USER PROFILE */}
        <div style={{ position: 'relative' }}>
          <div
            className="xfarm-user-profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="xfarm-avatar">MR</div>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Mario Rossi</span>
            <ChevronDown size={14} />
          </div>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#ffffff',
                color: '#1e293b',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                padding: '8px 12px',
                minWidth: '200px',
                zIndex: 200,
                border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700 }}>Mario Rossi</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                Head Agronomist &middot; Certified Bio
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />
              <div style={{ fontSize: '12px', color: '#334155', padding: '4px 0' }}>
                Role: Farm Manager
              </div>
              <div style={{ fontSize: '12px', color: '#334155', padding: '4px 0' }}>
                Subscription: xFarm Professional
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
