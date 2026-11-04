'use client';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sprout,
  RefreshCw,
} from 'lucide-react';
import { useTerra } from '@/lib/store';
import { post } from '@/lib/api';
import type { Analysis, Rotation } from '@/lib/types';
import { Panel, Notice, Busy, PageIntro, fmt } from './UI';
import { PriorityControls } from './FarmConfig';
import { ComparisonCharts } from './Charts';

export function RotationCard({
  rotation,
  index,
  onEdit,
}: {
  rotation: Rotation;
  index: number;
  onEdit?: () => void;
}) {
  const { catalog, selected, setSelected } = useTerra();
  const [expanded, setExpanded] = useState(false);
  const crops = catalog?.crops || {};
  return (
    <article className={`rotation-card ${selected === rotation.id ? 'selected' : ''}`}>
      <div className="rotation-head">
        <div>
          <span className="eyebrow">{index === 0 ? 'YOUR BASELINE' : `ALTERNATIVE 0${index}`}</span>
          <h3>{rotation.name}</h3>
        </div>
        <div className="score">
          <strong>{fmt(rotation.score, 1)}</strong>
          <span>weighted index / 100</span>
        </div>
      </div>
      <div className="rotation-tags">
        <span className={`badge ${rotation.feasible ? 'green' : 'amber'}`}>
          {rotation.feasible ? 'Passes configured constraints' : 'Constraint review needed'}
        </span>
        {rotation.pareto && <span className="badge">Nondominated among these 3</span>}
      </div>
      <div className="rotation-timeline">
        {rotation.sequence.map((c, i) => (
          <div
            key={i}
            className="crop-slot"
            style={{ '--crop': crops[c]?.color || '#a8b78b' } as React.CSSProperties}
          >
            <span className="season-label">
              S{i + 1} ·{' '}
              {new Date(2025, rotation.seasons[i].start_month - 1).toLocaleDateString('en', {
                month: 'short',
              })}
            </span>
            <Sprout size={23} strokeWidth={1.4} />
            <strong>{crops[c]?.name || c}</strong>
            <small>{crops[c]?.family}</small>
            <span className="crop-duration">{rotation.seasons[i].days} days</span>
          </div>
        ))}
      </div>
      <div className="metric-bars">
        {Object.entries(rotation.metrics).map(([k, v]) => (
          <div key={k}>
            <span>
              {k === 'water'
                ? 'Water adequacy'
                : k === 'diversity'
                  ? 'Rotation diversity'
                  : 'Temperature fit'}
            </span>
            <div>
              <i style={{ width: `${v}%` }} />
            </div>
            <strong>{fmt(v, 1)}</strong>
          </div>
        ))}
      </div>
      <div className="rotation-summary">
        <div>
          <strong>{fmt(rotation.water_deficit_mm)} mm</strong>
          <span>modeled unmet ET demand</span>
        </div>
        <div>
          <strong>{rotation.family_breaks} / 4</strong>
          <span>family breaks incl. prior crop</span>
        </div>
        <div>
          <strong>{rotation.legume_seasons}</strong>
          <span>legume seasons</span>
        </div>
      </div>
      <div className="rotation-actions">
        <button
          className={`button ${selected === rotation.id ? 'primary' : 'secondary'}`}
          onClick={() => setSelected(rotation.id)}
        >
          {selected === rotation.id ? (
            <>
              <Check size={14} />
              Selected for brief
            </>
          ) : (
            <>
              Select for brief
              <ArrowRight size={14} />
            </>
          )}
        </button>
        {onEdit && (
          <button className="text-button" onClick={onEdit}>
            Edit sequence
          </button>
        )}
        <button
          className="icon-button"
          aria-label={`Inspect ${rotation.name}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
      </div>
      {expanded && (
        <div className="rotation-details">
          <h4>Why this result?</h4>
          <p>
            Weighted contributions: water {rotation.contributions.water.toFixed(1)} + diversity{' '}
            {rotation.contributions.diversity.toFixed(1)} + temperature{' '}
            {rotation.contributions.suitability.toFixed(1)} = {rotation.score.toFixed(1)}. The water
            score measures supplied ET, so a thirsty crop can still score well in a wet replay.
          </p>
          <p>
            Legume seasons indicate potential nitrogen fixation. No soil-nitrogen improvement is
            predicted. Crop-family changes are a screening proxy; pests may share hosts across
            families.
          </p>
          <ul>
            {rotation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Season</th>
                  <th>ET demand</th>
                  <th>Unmet demand</th>
                  <th>Heat days</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {rotation.seasons.map((s) => (
                  <tr key={s.slot}>
                    <td>
                      {s.slot} · {crops[s.crop]?.name}
                    </td>
                    <td>{fmt(s.demand_mm)} mm</td>
                    <td>{fmt(s.deficit_mm)} mm</td>
                    <td>{s.heat_days}</td>
                    <td>{s.warnings.join(' ') || 'No modeled flags'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small>
            Heat thresholds and crop coefficients are illustrative. No pest incidence, yields,
            profits or soil-health outcomes are predicted.
          </small>
        </div>
      )}
    </article>
  );
}

export function RotationStudio() {
  const {
    analysis,
    farm,
    scenario,
    climate,
    start,
    end,
    mode,
    catalog,
    selected,
    setView,
    customAnalysis: custom,
    setCustomAnalysis: setCustom,
  } = useTerra();
  const [editing, setEditing] = useState<number | null>(null);
  const [sequences, setSequences] = useState<string[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setSequences(null);
    setEditing(null);
  }, [analysis.data]);
  const data = analysis.data;
  async function apply() {
    if (!sequences) return;
    setBusy(true);
    setError(null);
    try {
      const d = await post<Analysis>('analyze', {
        farm,
        climate: { latitude: farm.latitude, longitude: farm.longitude, start, end, mode },
        scenario,
        alternatives: sequences,
      });
      setCustom(d);
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }
  return (
    <>
      <PageIntro
        eyebrow="CROP ROTATION STUDIO"
        title="One farm. More than one way forward."
        description="Compare your existing sequence with computed alternatives. Make the trade-offs yours."
      >
        <button className="button secondary" onClick={() => setView('climate')}>
          Stress-test a strategy
          <ArrowRight size={15} />
        </button>
      </PageIntro>
      <Notice>
        Educational screening model. Crop traits and water-balance assumptions need local
        calibration. Scores express transparent preferences; they do not predict harvests or soil
        improvement.
      </Notice>
      <div className="studio-layout">
        <div className="rotation-list">
          {analysis.loading ? (
            <Busy text="Exploring feasible crop sequences…" />
          ) : analysis.error ? (
            <Notice tone="error">{analysis.error}</Notice>
          ) : (
            data?.rotations.map((r, i) => (
              <RotationCard
                key={r.id}
                rotation={r}
                index={i}
                onEdit={
                  i
                    ? () => {
                        setSequences(data.rotations.slice(1).map((x) => [...x.sequence]));
                        setEditing(i - 1);
                      }
                    : undefined
                }
              />
            ))
          )}
          {editing !== null && sequences && (
            <Panel title="Make this alternative your own" eyebrow="EDIT & RECOMPUTE">
              <div className="form-grid">
                {sequences[editing].map((c, i) => (
                  <label className="field" key={i}>
                    <span>Season {i + 1}</span>
                    <select
                      aria-label={`Alternative ${editing + 1}, season ${i + 1}`}
                      value={c}
                      onChange={(e) =>
                        setSequences((prev) =>
                          prev!.map((seq, j) =>
                            j === editing ? seq.map((v, k) => (k === i ? e.target.value : v)) : seq,
                          ),
                        )
                      }
                    >
                      {Object.entries(catalog?.crops || {}).map(([id, crop]) => (
                        <option value={id} key={id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {error && <Notice tone="error">{error}</Notice>}
              <div className="inline-actions">
                <button className="button primary" disabled={busy} onClick={apply}>
                  {busy ? 'Recomputing…' : 'Recompute both alternatives'}
                </button>
                <button className="button secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
              <small>
                Edited comparisons carry into the decision brief and charts. Changing farm inputs,
                priorities, dates, or climate regenerates the alternatives.
              </small>
            </Panel>
          )}
          {custom && (
            <Notice>
              Showing your edited alternatives.{' '}
              <button
                className="text-button"
                onClick={() => {
                  setCustom(null);
                  setSequences(null);
                }}
              >
                Return to generated strategies
              </button>
            </Notice>
          )}
        </div>
        <aside className="studio-sidebar">
          <Panel title="Your priorities" eyebrow="YOU DEFINE THE BALANCE">
            <PriorityControls />
          </Panel>
          <div className="dark-panel">
            <SlidersHorizontal size={23} />
            <h3>Computed, then explained.</h3>
            <p>
              {data
                ? `${data.candidate_count.toLocaleString()} feasible alternatives explored.`
                : 'Configure constraints to explore alternatives.'}{' '}
              Each candidate is checked against crop preferences, equipment, and the available
              growing window.
            </p>
            <button className="text-button" onClick={() => setView('evidence')}>
              Follow the calculation
              <ArrowRight size={14} />
            </button>
          </div>
          <Panel title="Reading the comparison">
            <p className="body-copy">
              Priority-led: highest weighted score among generated feasible alternatives.
            </p>
            <p className="body-copy">
              Water-lean: a distinct strategy that maximizes water adequacy, then minimizes total
              modeled ET demand, then maximizes diversity. Ties are resolved deterministically by
              crop identifier.
            </p>
            <p className="body-copy">
              Nondominated means no other displayed option matches or improves every criterion while
              improving at least one.
            </p>
            {data && (
              <button
                className="button secondary"
                onClick={() =>
                  import('@/lib/api').then(({ downloadJSON }) =>
                    downloadJSON('terrashift-comparison.json', data),
                  )
                }
              >
                Export comparison JSON
              </button>
            )}
          </Panel>
        </aside>
      </div>
      <ComparisonCharts />
      {data && (
        <div className="section-end">
          <span>{data.model}</span>
          <button className="button primary" onClick={() => setView('brief')}>
            Prepare decision brief
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </>
  );
}
