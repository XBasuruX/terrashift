'use client';
import { Printer, Download, ArrowRight, Leaf } from 'lucide-react';
import { useTerra } from '@/lib/store';
import { downloadJSON } from '@/lib/api';
import { PageIntro, Panel, Notice, fmt, LinkOut } from './UI';
export function DecisionBrief() {
  const { analysis, activeRotation, catalog, setView } = useTerra();
  const d = analysis.data;
  return (
    <>
      <div className="no-print">
        <PageIntro
          eyebrow="FARMER DECISION BRIEF"
          title="A considered next step, on paper."
          description="A portable record of your assumptions, alternatives, and questions to take to a local agronomist."
        >
          <div className="inline-actions">
            <button
              className="button secondary"
              disabled={!d}
              onClick={() =>
                d &&
                downloadJSON('terrashift-decision-brief.json', {
                  ...d,
                  selected_rotation: activeRotation?.id,
                })
              }
            >
              <Download size={15} />
              JSON
            </button>
            <button className="button primary" disabled={!d} onClick={() => window.print()}>
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
        </PageIntro>
      </div>
      {!d ? (
        <Notice tone={analysis.error ? 'error' : 'info'}>
          {analysis.error || 'A valid computed comparison is required to generate a brief.'}
          <button className="text-button" onClick={() => setView('rotations')}>
            Open Rotation Studio
            <ArrowRight size={14} />
          </button>
        </Notice>
      ) : (
        <article className="decision-document">
          <div className="brief-masthead">
            <div className="brand-mark">
              <Leaf size={27} />
              <span>
                terra<strong>shift</strong>
              </span>
            </div>
            <div>
              FIELD NOTES / DECISION BRIEF
              <br />
              {new Date().toLocaleDateString('en-GB', {
                timeZone: 'Asia/Colombo',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
          <div className="brief-title">
            <span className="eyebrow">UNDERSTAND YOUR LAND. EXPLORE YOUR FUTURE.</span>
            <h1>{d.farm.name}</h1>
            <p>
              {d.farm.latitude}°, {d.farm.longitude}° · {d.farm.area_ha} hectares · {d.farm.soil}{' '}
              soil
            </p>
          </div>
          <Notice tone="warning">
            Educational scenario screening. Active weather mode:{' '}
            <strong>{d.provenance.mode}</strong> ({d.provenance.classification}). Results are not
            validated agricultural recommendations, yield forecasts, or profit estimates.
          </Notice>
          <section>
            <h2>01 / The question & the farm</h2>
            <p>
              Explore four-season crop rotations given {d.farm.irrigation_mm} mm irrigation per
              season, {d.farm.available_water_mm} mm plant-available soil storage and a{' '}
              {d.farm.season_length_days}-day growing window. Planting begins in month{' '}
              {d.farm.season_start_month}, with subsequent slots six months apart.
            </p>
            <p>
              Farmer priorities: water adequacy {fmt(d.weights.water * 100)}%, diversity{' '}
              {fmt(d.weights.diversity * 100)}%, temperature fit {fmt(d.weights.suitability * 100)}
              %. Previous crop: {catalog?.crops[d.farm.previous_crop]?.name}. Equipment:{' '}
              {d.farm.equipment}.
            </p>
            <p>
              <strong>Local economic context:</strong>{' '}
              {d.farm.market_note || 'No market notes provided. Confirm costs and buyers locally.'}
            </p>
          </section>
          <section>
            <h2>02 / Environmental evidence & scenario</h2>
            <p>
              {d.provenance.source}; {d.provenance.start} to {d.provenance.end}. Daily{' '}
              {d.provenance.time_standard}. Spatial support: {d.provenance.resolution}. Null
              parameter values: {d.provenance.missing_values}.
            </p>
            <p>
              Replay: {d.scenario.kind}
              {d.replay_year ? ` (${d.replay_year})` : ''}; temperature shift{' '}
              {d.scenario.temperature_delta}°C; rainfall multiplier {d.scenario.rainfall_factor}.
              These perturbations are hypothetical, not forecasts.
            </p>
            {d.provenance.warning && (
              <p>
                <strong>Provider warning:</strong> {d.provenance.warning}
              </p>
            )}
            <LinkOut href={d.provenance.request_url}>Full NASA POWER request</LinkOut>
            <p className="hash">Normalized observation SHA-256: {d.provenance.sha256}</p>
          </section>
          <section>
            <h2>03 / Compare the alternatives</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Four-season sequence</th>
                    <th>Index /100</th>
                    <th>Unmet ET demand</th>
                    <th>Constraints</th>
                  </tr>
                </thead>
                <tbody>
                  {d.rotations.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.name}
                        {r.id === activeRotation?.id ? ' · selected' : ''}
                      </td>
                      <td>{r.sequence.map((c) => catalog?.crops[c]?.name || c).join(' → ')}</td>
                      <td>{fmt(r.score, 1)}</td>
                      <td>{fmt(r.water_deficit_mm)} mm</td>
                      <td>{r.feasible ? 'Pass' : 'Review'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              {d.candidate_count.toLocaleString()} feasible generated alternatives explored.
              Weighted score = water adequacy × weight + diversity × weight + temperature fit ×
              weight. This index does not establish a best real-world farm strategy.
            </p>
          </section>
          {activeRotation && (
            <section data-testid="selected-strategy-brief">
              <h2>04 / Strategy to investigate: {activeRotation.name}</h2>
              <p>
                <strong>
                  {activeRotation.sequence.map((c) => catalog?.crops[c]?.name || c).join(' → ')}
                </strong>
              </p>
              <p>
                Water adequacy {fmt(activeRotation.metrics.water, 1)}/100; diversity{' '}
                {fmt(activeRotation.metrics.diversity, 1)}/100; temperature fit{' '}
                {fmt(activeRotation.metrics.suitability, 1)}/100. {activeRotation.legume_seasons}{' '}
                legume seasons and {activeRotation.family_breaks} family changes including the
                previous crop offer hypotheses to discuss, not measured soil-health improvements.
              </p>
              <p>
                Worst fixed stress-test index: {fmt(activeRotation.robust_score, 1)}. Across four
                illustrative perturbations:{' '}
                {activeRotation.stress.map((s) => `${s.scenario} ${fmt(s.score, 1)}`).join('; ')}.
              </p>
              <ul>
                {activeRotation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {activeRotation.seasons
                  .filter((s) => s.warnings.length)
                  .map((s) => (
                    <li key={s.slot}>
                      Season {s.slot}: {s.warnings.join(' ')}
                    </li>
                  ))}
              </ul>
            </section>
          )}
          <section>
            <h2>05 / Assumptions & limitations</h2>
            <ol>
              {d.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2>06 / Questions for a local expert</h2>
            <ul>
              <li>Are these crop durations, cultivars and planting dates locally feasible?</li>
              <li>
                Can soil tests and local weather records calibrate storage and crop water demand?
              </li>
              <li>Which pests or diseases are shared by the selected crops?</li>
              <li>
                Are irrigation timing, paddy water losses, drainage and erosion risks acceptable?
              </li>
              <li>Are labor, equipment, seed, buyers and financial risks manageable?</li>
            </ul>
            <p>
              No claims are made about precise nutrient gains, future yields, profitability,
              soil-carbon accumulation or long-term erosion reduction. Real-world outcomes require
              local agronomic review and field validation.
            </p>
          </section>
          <footer>
            TerraShift · {d.model}
            <br />
            Independent student learning reference. No NASA endorsement. Reproducible software is a
            starting point for scientific validation.
          </footer>
        </article>
      )}
    </>
  );
}
