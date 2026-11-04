'use client';
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  MapPin,
  Sprout,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import { useTerra } from '@/lib/store';
import { samples } from '@/lib/defaults';
import { MapExplorer } from './MapExplorer';
import { ClimateChart, SeasonalComparison } from './Charts';
import { Panel, PageIntro, Stat, fmt, Notice, Busy } from './UI';

export function FarmPicker() {
  const { farm, updateFarm } = useTerra();
  return (
    <select
      className="farm-picker"
      aria-label="Choose sample farm"
      value={
        samples.find((s) => s.latitude === farm.latitude && s.longitude === farm.longitude)?.name ||
        'custom'
      }
      onChange={(e) => {
        const s = samples.find((x) => x.name === e.target.value);
        if (s)
          updateFarm({
            latitude: s.latitude,
            longitude: s.longitude,
            name: `${s.name.split(',')[0]} learning farm`,
            area_ha: s.area,
          });
      }}
    >
      {!samples.some((s) => s.latitude === farm.latitude && s.longitude === farm.longitude) && (
        <option value="custom">Custom location</option>
      )}
      {samples.map((s) => (
        <option key={s.name}>{s.name}</option>
      ))}
    </select>
  );
}
export function EnvironmentStats() {
  const { climate } = useTerra();
  const s = climate.data?.summary;
  return (
    <div className="stats-row">
      <Stat
        label="MEAN TEMPERATURE"
        value={fmt(s?.temperature, 1)}
        unit="°C"
        detail="Selected interval · daily mean"
        icon={<Thermometer size={16} />}
      />
      <Stat
        label="TOTAL RAINFALL"
        value={fmt(s?.precipitation)}
        unit="mm"
        detail="Sum across selected interval"
        icon={<Droplets size={16} />}
      />
      <Stat
        label="LONGEST DRY SPELL"
        value={fmt(s?.longest_dry_spell)}
        unit="days"
        detail="Consecutive days below 1 mm"
        icon={<Sun size={16} />}
      />
      <Stat
        label="DATA COMPLETENESS"
        value={s ? fmt(s.coverage * 100, 1) : '—'}
        unit="%"
        detail="Rainfall / temperature availability"
        icon={<Activity size={16} />}
      />
    </div>
  );
}
export function Overview() {
  const { farm, climate, analysis, setView, catalog } = useTerra();
  const [kind, setKind] = useState<'combined' | 'temperature' | 'water'>('combined');
  return (
    <>
      <PageIntro
        eyebrow="YOUR LAND, IN PERSPECTIVE"
        title="Every season starts with understanding."
        description="Explore the signals. Connect the patterns. Plan what comes next."
      >
        <button className="button primary" onClick={() => setView('rotations')}>
          Explore rotations
          <ArrowUpRight size={16} />
        </button>
      </PageIntro>
      <div className="landscape-layout">
        <MapExplorer />
        <aside className="landscape-aside">
          <div className="aside-location">
            <span className="eyebrow">YOUR LEARNING LANDSCAPE</span>
            <h2>{farm.name.replace(' learning farm', '')}</h2>
            <p>
              <MapPin size={13} />
              {farm.latitude.toFixed(3)}°, {farm.longitude.toFixed(3)}°
            </p>
            <FarmPicker />
          </div>
          <div className="farm-facts">
            <div>
              <span>Farm area</span>
              <strong>
                {farm.area_ha} <small>ha</small>
              </strong>
            </div>
            <div>
              <span>Soil profile</span>
              <strong>{farm.soil}</strong>
            </div>
            <div>
              <span>Water budget</span>
              <strong>
                {farm.irrigation_mm} <small>mm / season</small>
              </strong>
            </div>
          </div>
          <div className="signal-note">
            <div className="round-icon">
              <Sprout size={20} />
            </div>
            <div>
              <strong>What could your next season look like?</strong>
              <p>Explore rotations that match your water limits and what matters to you.</p>
            </div>
          </div>
          <button className="text-button" onClick={() => setView('farm')}>
            Configure your farm
            <ArrowRight size={16} />
          </button>
        </aside>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">READ YOUR ENVIRONMENT</span>
          <h2>A landscape of signals</h2>
        </div>
        <span className="subtle">
          {climate.data?.provenance.source || 'Waiting for environmental data'}
        </span>
      </div>
      <EnvironmentStats />
      <div className="dashboard-bottom">
        <Panel
          title="The rhythm of your climate"
          eyebrow="TEMPERATURE & PRECIPITATION"
          action={
            <div className="segmented">
              {(['combined', 'temperature', 'water'] as const).map((k) => (
                <button className={kind === k ? 'active' : ''} key={k} onClick={() => setKind(k)}>
                  {k === 'combined' ? 'Together' : k === 'temperature' ? 'Temperature' : 'Water'}
                </button>
              ))}
            </div>
          }
        >
          {climate.loading ? (
            <Busy text="Reading the climate record…" />
          ) : climate.data ? (
            <>
              <div className="chart-legend">
                <span>
                  <i style={{ background: '#a9bd9d' }} />
                  Rainfall · mm
                </span>
                <span>
                  <i style={{ background: '#c58d57' }} />
                  {kind === 'water' ? 'Estimated ET₀ · mm' : 'Temperature · °C'}
                </span>
              </div>
              <ClimateChart data={climate.data.monthly} kind={kind} />
              <div className="chart-footer">
                {climate.data.provenance.start} — {climate.data.provenance.end}
                <button className="text-button" onClick={() => setView('climate')}>
                  Investigate patterns
                  <ArrowRight size={13} />
                </button>
              </div>
            </>
          ) : (
            <Notice tone="error">{climate.error || 'Climate record unavailable.'}</Notice>
          )}
        </Panel>
        <Panel
          className="next-step"
          title="Different crops. New possibilities."
          eyebrow="THE ROTATION OPPORTUNITY"
        >
          <div className="botanical">
            <Sprout size={76} strokeWidth={0.7} />
            <div className="botanical-orbit" />
            <span>01 → 02 → 03 → 04</span>
          </div>
          <p>
            Start with your current sequence. Compare alternatives, then see how they hold up under
            a different climate.
          </p>
          {analysis.data && (
            <div className="mini-rotation">
              {analysis.data.rotations[1].sequence.map((c, i) => (
                <span key={i} style={{ borderColor: catalog?.crops[c].color }}>
                  {catalog?.crops[c].name}
                </span>
              ))}
            </div>
          )}
          <button className="text-button" onClick={() => setView('rotations')}>
            Enter Rotation Studio
            <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
      <div className="science-strip">
        <ShieldCheck size={22} />
        <div>
          <strong>Curiosity, backed by evidence.</strong>
          <span>Every observation has a source. Every model has assumptions. Explore both.</span>
        </div>
        <button onClick={() => setView('evidence')}>
          Open the evidence
          <ArrowUpRight size={15} />
        </button>
      </div>
    </>
  );
}

export function Explorer() {
  const { climate, setView } = useTerra();
  return (
    <>
      <PageIntro
        eyebrow="EARTH EXPLORER"
        title="The big picture. Your place in it."
        description="Explore Sri Lanka in Cesium. Find a town, enable NSDI reference layers, and draw each farm by placing boundary points."
      >
        <FarmPicker />
      </PageIntro>
      <MapExplorer large />
      <div className="two-col">
        <Panel title="A point is not a pixel" eyebrow="SPATIAL HONESTY">
          <p className="body-copy">
            Your farm is a chosen location. POWER meteorology represents a grid of roughly 0.5° ×
            0.625°, covering thousands of hectares. A drawn field boundary does not increase that
            observational resolution. Farm area is a scenario input; it is not a measured cadastral
            boundary.
          </p>
          <button className="text-button" onClick={() => setView('farm')}>
            Set location and farm area
            <ArrowRight size={15} />
          </button>
        </Panel>
        <Panel title="Read the layers" eyebrow="VISUAL CONTEXT">
          <p className="body-copy">
            Esri imagery provides visual context with variable acquisition dates. NSDI overlays
            provide regional soil, agro-ecological and water classifications. My Farm retrieves
            recent free Sentinel-2 scenes and native 10 m field crops with acquisition dates. These
            layers do not automatically become validated crop-model inputs.
          </p>
          <span className="badge">
            Active weather: {climate.data?.provenance.mode || 'loading'}
          </span>
        </Panel>
      </div>
      <EnvironmentStats />
      <SeasonalComparison />
    </>
  );
}
