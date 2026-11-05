'use client';
import { useState, useEffect } from 'react';
import {
  Leaf,
  LayoutDashboard,
  Globe2,
  Tractor,
  Rows3,
  FlaskConical,
  LibraryBig,
  FileText,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  Compass,
  Menu,
  X,
  HelpCircle,
  Satellite,
} from 'lucide-react';
import type { View, Mode } from '@/lib/types';
import { useTerra } from '@/lib/store';
import { Overview, Explorer } from './Overview';
import { FieldOperations } from './xfarm/XFarmShell';
import { FarmConfig } from './FarmConfig';
import { RotationStudio } from './RotationStudio';
import { ClimateLab } from './ClimateLab';
import { Evidence } from './Evidence';
import { DecisionBrief } from './DecisionBrief';
import { Notice } from './UI';
const nav: { id: View; name: string; icon: typeof Leaf; number: string }[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, number: '01' },
  { id: 'explorer', name: 'Earth Explorer', icon: Globe2, number: '02' },
  { id: 'farm', name: 'My Farm', icon: Tractor, number: '03' },
  { id: 'rotations', name: 'Rotation Studio', icon: Rows3, number: '04' },
  { id: 'climate', name: 'Climate Lab', icon: FlaskConical, number: '05' },
  { id: 'evidence', name: 'Evidence & Sources', icon: LibraryBig, number: '06' },
  { id: 'brief', name: 'Decision Brief', icon: FileText, number: '07' },
  { id: 'operations', name: 'Field Operations', icon: Leaf, number: '08' },
];
const tourSteps: [View, string, string][] = [
  [
    'overview',
    'Start with the landscape',
    'Choose a sample farm. Read the environmental record and check the active data mode before interpreting a chart.',
  ],
  [
    'explorer',
    'Find your place',
    'Search a Sri Lankan town. Open NSDI layers for regional soil and agro-ecological context. Draw a new farm by placing perimeter points and saving the boundary.',
  ],
  [
    'farm',
    'Bring your farm knowledge',
    'Set soil storage, water limits, current crops and equipment. Your assumptions persist in this browser.',
  ],
  [
    'rotations',
    'Explore the trade-offs',
    'Inspect three sequences, change priority sliders, and open a card to see every weighted contribution and constraint.',
  ],
  [
    'climate',
    'Challenge the assumptions',
    'Replay a dry or wet selected year, or perturb temperature and rainfall. Scores recompute; source charts stay unchanged.',
  ],
  [
    'evidence',
    'Follow the evidence',
    'Inspect the source receipt, missing observations, calculation pathway, and unvalidated crop assumptions.',
  ],
  [
    'brief',
    'Take the questions with you',
    'Select a strategy in Rotation Studio, then print a decision brief or save it as PDF using your browser.',
  ],
];
export function Shell() {
  const {
    view,
    setView,
    mode,
    setMode,
    start,
    setStart,
    end,
    setEnd,
    learning,
    setLearning,
    climate,
    analysis,
    catalogError,
    storageWarning,
  } = useTerra();
  const [mobile, setMobile] = useState(false),
    [tour, setTour] = useState<number | null>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTour(null);
        setMobile(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  function go(v: View) {
    setView(v);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function tourTo(i: number) {
    setTour(i);
    go(tourSteps[i][0]);
  }
  const active = climate.data?.provenance.mode;
  const latestRecordDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() - 86400000));
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-shade"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <button className="brand" onClick={() => go('overview')} aria-label="TerraShift home">
          <div className="brand-symbol">
            <Leaf size={25} strokeWidth={1.6} />
          </div>
          <span>
            terra<strong>shift</strong>
            <small>EARTH INSIGHT. FARM POSSIBILITY.</small>
          </span>
        </button>
        <div className="workspace-label">
          <span className="live-dot" />
          EXPLORATION WORKSPACE
        </div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? 'active' : ''}
              onClick={() => go(n.id)}
              aria-current={view === n.id ? 'page' : undefined}
            >
              <n.icon size={18} strokeWidth={1.6} />
              <span>{n.name}</span>
              <small>{n.number}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="learning-card">
            <Compass size={24} strokeWidth={1.4} />
            <span className="eyebrow">BUILT FOR THE CURIOUS</span>
            <h3>
              From observation
              <br />
              to understanding.
            </h3>
            <p>A working reference for your next big idea.</p>
            <button onClick={() => tourTo(0)}>
              Take a guided tour
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className={`learning-toggle ${learning ? 'on' : ''}`}
            onClick={() => setLearning(!learning)}
            aria-pressed={learning}
          >
            <Code2 size={17} />
            <span>Learning mode</span>
            <span className="toggle-switch">
              <i />
            </span>
          </button>
          <div className="team-signature">
            <div>TS</div>
            <span>
              Student exploration<small>NASA Space Apps · 2026</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{nav.find((n) => n.id === view)?.name}</strong>
            <span className="reference-badge">EDUCATIONAL REFERENCE</span>
          </div>
          <div className="topbar-actions">
            <a
              href="https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/"
              target="_blank"
              rel="noreferrer"
            >
              The challenge
              <ArrowUpRight size={13} />
            </a>
            <button className="icon-button" aria-label="Open guided tour" onClick={() => tourTo(0)}>
              <HelpCircle size={18} />
            </button>
            <div className="avatar" title="Local learning workspace">
              TS
            </div>
          </div>
        </header>
        <div className="data-toolbar">
          <div className={`data-mode ${active === 'simulation' ? 'sim' : ''}`}>
            <Satellite size={15} />
            <span className="live-dot" />
            {climate.loading
              ? 'READING ENVIRONMENT'
              : active === 'simulation'
                ? 'SIMULATED WEATHER'
                : active === 'cached'
                  ? 'CACHED NASA OBSERVATIONS'
                  : active === 'live'
                    ? 'LIVE NASA RESPONSE'
                    : 'DATA UNAVAILABLE'}
          </div>
          <div className="data-controls">
            <label>
              Provider
              <select
                aria-label="Data provider mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                <option value="cached">Cached first</option>
                <option value="live">Live NASA POWER</option>
                <option value="simulation">Simulation</option>
              </select>
            </label>
            <label className="date-label">
              Record
              <input
                aria-label="Observation start date"
                type="date"
                value={start}
                min="1981-01-01"
                max={end}
                onChange={(e) => {
                  if (e.target.value) setStart(e.target.value);
                }}
              />
              <span>—</span>
              <input
                aria-label="Observation end date"
                type="date"
                value={end}
                min={start}
                max={latestRecordDate}
                onChange={(e) => {
                  if (e.target.value) setEnd(e.target.value);
                }}
              />
            </label>
          </div>
        </div>
        <main id="main-content" className="main-content">
          {catalogError && (
            <Notice tone="error">
              {catalogError} See README for launch instructions, then refresh.
            </Notice>
          )}
          {storageWarning && <Notice tone="warning">{storageWarning}</Notice>}
          {climate.data?.provenance.warning && (
            <div className="provider-warning no-print">
              <Notice tone="warning">{climate.data.provenance.warning}</Notice>
            </div>
          )}
          {climate.error && view !== 'overview' && <Notice tone="error">{climate.error}</Notice>}
          {view === 'overview' ? (
            <Overview />
          ) : view === 'explorer' ? (
            <Explorer />
          ) : view === 'operations' ? (
            <FieldOperations />
          ) : view === 'farm' ? (
            <FarmConfig />
          ) : view === 'rotations' ? (
            <RotationStudio />
          ) : view === 'climate' ? (
            <ClimateLab />
          ) : view === 'evidence' ? (
            <Evidence />
          ) : (
            <DecisionBrief />
          )}
          {learning && (
            <div className="learning-inspector no-print">
              <div>
                <Code2 size={18} />
                <strong>Inside this view</strong>
                <span className="badge">LEARNING MODE</span>
              </div>
              <dl>
                <dt>Provider</dt>
                <dd>
                  {active || 'unavailable'} · {climate.data?.provenance.classification}
                </dd>
                <dt>Endpoints</dt>
                <dd>POST /api/climate → POST /api/analyze</dd>
                <dt>Frontend</dt>
                <dd>
                  src/lib/store.tsx → src/components/
                  {view === 'overview'
                    ? 'Overview'
                    : view === 'rotations'
                      ? 'RotationStudio'
                      : view === 'climate'
                        ? 'ClimateLab'
                        : view === 'farm'
                          ? 'FarmConfig'
                          : view === 'brief'
                            ? 'DecisionBrief'
                            : view === 'evidence'
                              ? 'Evidence'
                              : view === 'operations'
                                ? 'xfarm/XFarmShell'
                                : 'MapExplorer'}
                  .tsx
                </dd>
                <dt>Data path</dt>
                <dd>backend/providers/service.py → power.py or simulation.py</dd>
                <dt>Calculation</dt>
                <dd>backend/science/climate.py → rotation.py</dd>
                <dt>Status</dt>
                <dd>
                  {analysis.loading
                    ? 'Computing comparison'
                    : analysis.error ||
                      `${analysis.data?.candidate_count || 0} feasible generated alternatives · deterministic model v1`}
                </dd>
              </dl>
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>
            <Leaf size={13} />
            TerraShift <span className="footer-dot">·</span> Understand Your Land. Explore Your
            Future.
          </span>
          <span>Independent educational project · No NASA endorsement</span>
        </footer>
      </div>
      {tour !== null && (
        <div
          className="tour-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTour(null);
          }}
        >
          <section
            className="tour-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
          >
            <button
              className="tour-close icon-button"
              autoFocus
              aria-label="Close tour"
              onClick={() => setTour(null)}
            >
              <X size={19} />
            </button>
            <div className="tour-icon">
              <Compass size={35} strokeWidth={1.2} />
            </div>
            <span className="eyebrow">
              YOUR TERRASHIFT FIELD GUIDE · {tour + 1} / {tourSteps.length}
            </span>
            <h2 id="tour-title">{tourSteps[tour][1]}</h2>
            <p>{tourSteps[tour][2]}</p>
            <div className="tour-dots">
              {tourSteps.map((s, i) => (
                <button
                  aria-label={`Tour step ${i + 1}`}
                  key={s[0]}
                  className={i === tour ? 'active' : ''}
                  onClick={() => tourTo(i)}
                />
              ))}
            </div>
            <div className="inline-actions">
              {tour > 0 && (
                <button className="button secondary" onClick={() => tourTo(tour - 1)}>
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}
              <button
                className="button primary"
                onClick={() => (tour === tourSteps.length - 1 ? setTour(null) : tourTo(tour + 1))}
              >
                {tour === tourSteps.length - 1 ? 'Start exploring' : 'Next stop'}
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
