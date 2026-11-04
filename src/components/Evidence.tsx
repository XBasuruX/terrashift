'use client';
import {
  Database,
  Satellite,
  SlidersHorizontal,
  FlaskConical,
  GitBranch,
  ArrowDown,
  ArrowRight,
  FileJson,
  Code2,
} from 'lucide-react';
import { useTerra } from '@/lib/store';
import { downloadJSON } from '@/lib/api';
import { Panel, PageIntro, Notice, LinkOut, fmt } from './UI';

export function Evidence() {
  const { climate, analysis, catalog, farm, learning, setLearning } = useTerra();
  const p = climate.data?.provenance;
  return (
    <>
      <PageIntro
        eyebrow="EVIDENCE & SCIENTIFIC TRANSPARENCY"
        title="Good decisions leave a trail."
        description="Open the data receipt. Follow the calculation. Understand what the result can—and cannot—tell you."
      >
        <button
          className={`button ${learning ? 'primary' : 'secondary'}`}
          onClick={() => setLearning(!learning)}
        >
          <Code2 size={15} />
          {learning ? 'Learning mode on' : 'Enable learning mode'}
        </button>
      </PageIntro>
      <div className="provenance-flow">
        <div>
          <Satellite size={24} />
          <strong>{p?.mode === 'simulation' ? 'Synthetic weather' : 'NASA POWER'}</strong>
          <span>{p?.classification || 'Provider'}</span>
        </div>
        <ArrowRight />
        <div>
          <Database size={24} />
          <strong>Normalize & check</strong>
          <span>Dates · units · null values</span>
        </div>
        <ArrowRight />
        <div>
          <SlidersHorizontal size={24} />
          <strong>Farm + priorities</strong>
          <span>Farmer-entered assumptions</span>
        </div>
        <ArrowRight />
        <div>
          <FlaskConical size={24} />
          <strong>Replay & compare</strong>
          <span>ET₀ · bucket · constraints</span>
        </div>
        <ArrowRight />
        <div>
          <GitBranch size={24} />
          <strong>Three alternatives</strong>
          <span>Explainable weighted indices</span>
        </div>
      </div>
      <div className="two-col">
        <Panel title="Your environmental data receipt" eyebrow="PROVENANCE">
          {p ? (
            <>
              <dl className="receipt">
                <div>
                  <dt>Requested → active mode</dt>
                  <dd>
                    {p.requested_mode} → {p.mode}
                  </dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{p.source}</dd>
                </div>
                <div>
                  <dt>Classification</dt>
                  <dd>{p.classification}</dd>
                </div>
                <div>
                  <dt>Coordinates (lat, lon)</dt>
                  <dd>
                    {p.latitude}, {p.longitude}
                  </dd>
                </div>
                <div>
                  <dt>Observation interval</dt>
                  <dd>
                    {p.start} — {p.end}
                  </dd>
                </div>
                <div>
                  <dt>Spatial support</dt>
                  <dd>{p.resolution}</dd>
                </div>
                <div>
                  <dt>Daily time standard</dt>
                  <dd>{p.time_standard}</dd>
                </div>
                <div>
                  <dt>Null observations</dt>
                  <dd>{p.missing_values} parameter values</dd>
                </div>
                <div>
                  <dt>Retrieved / fixture</dt>
                  <dd>{p.retrieved_at || 'Not applicable · synthetic generation'}</dd>
                </div>
                <div>
                  <dt>Normalized SHA-256</dt>
                  <dd className="hash">{p.sha256}</dd>
                </div>
              </dl>
              <div className="inline-actions">
                <button
                  className="button secondary"
                  onClick={() => downloadJSON('terrashift-data-receipt.json', p)}
                >
                  <FileJson size={14} />
                  Export receipt
                </button>
                <LinkOut href={p.request_url}>Inspect POWER request</LinkOut>
              </div>
            </>
          ) : (
            <Notice>Load environmental data to inspect a receipt.</Notice>
          )}
        </Panel>
        <Panel title="How each number is made" eyebrow="DATA CLASSIFICATION">
          <div className="classification-list">
            <div>
              <span className="class-dot observed" />
              <div>
                <strong>Gridded estimate</strong>
                <p>
                  POWER temperatures and precipitation combine modeled and observational inputs at
                  coarse resolution. They are not direct field measurements.
                </p>
              </div>
            </div>
            <div>
              <span className="class-dot derived" />
              <div>
                <strong>Derived calculation</strong>
                <p>
                  Monthly statistics, ET₀, water balance, constraint flags, and comparison indices
                  are computed deterministically.
                </p>
              </div>
            </div>
            <div>
              <span className="class-dot entered" />
              <div>
                <strong>Farmer-entered assumption</strong>
                <p>
                  Soil texture, storage capacity, irrigation, crop sequence, field area, markets and
                  priorities come from configuration.
                </p>
              </div>
            </div>
            <div>
              <span className="class-dot simulated" />
              <div>
                <strong>Simulation</strong>
                <p>
                  Deterministic synthetic weather is explicitly labeled. Hypothetical climate
                  perturbations are never described as forecasts.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">NASA DATA CATALOG</span>
          <h2>Connected today. Investigated for tomorrow.</h2>
        </div>
        <span className="subtle">
          Data products have different spatial support and quality requirements.
        </span>
      </div>
      <div className="source-grid">
        {catalog?.sources.map((s) => (
          <Panel key={s.id}>
            <div className="source-head">
              <Satellite size={22} />
              <span className={`badge ${s.status === 'implemented' ? 'green' : ''}`}>
                {s.status}
              </span>
            </div>
            <h3>{s.name}</h3>
            <div className="source-meta">
              <span>{s.resolution}</span>
              <span>{s.temporal}</span>
              <span>{s.units}</span>
            </div>
            <p className="body-copy">{s.note}</p>
            <LinkOut href={s.url}>Official documentation</LinkOut>
          </Panel>
        ))}
      </div>
      <div className="two-col">
        <Panel title="Model assumptions" eyebrow="READ BEFORE INTERPRETING">
          <ol className="assumptions">
            {(
              analysis.data?.assumptions || ['Load a valid analysis to inspect its assumptions.']
            ).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
          <LinkOut href="https://www.fao.org/4/x0490e/x0490e07.htm">
            FAO-56 · meteorological calculations
          </LinkOut>
        </Panel>
        <Panel title="What needs local validation?" eyebrow="LIMITATIONS & UNCERTAINTY">
          <ul className="review-list">
            <li>Crop suitability, local cultivars, planting dates and crop coefficients.</li>
            <li>
              Soil water-holding capacity, rooting depth, infiltration, slope, drainage and
              irrigation timing.
            </li>
            <li>
              Weather bias, extreme events and whether a coarse grid represents this landscape.
            </li>
            <li>
              Pest and disease hosts, legume nodulation, residue handling, and nutrient budgets.
            </li>
            <li>Market access, labor, equipment, input costs and local profitability.</li>
            <li>Paddy seepage, ponding, runoff and multi-year soil change are not modeled.</li>
          </ul>
          <Notice tone="warning">
            Software tests establish reproducibility and mathematical behavior. They do not
            establish scientific validity or real-world agricultural effectiveness.
          </Notice>
        </Panel>
      </div>
      <Panel
        title="Crop knowledge is a starting hypothesis"
        eyebrow="ILLUSTRATIVE TRAITS, NOT CULTIVAR ADVICE"
      >
        <p className="body-copy">
          Family membership and legume identity are categorical reference facts. Durations, Kc, root
          depths and temperature limits in this application are deliberately visible educational
          assumptions. A constant season-average Kc is not FAO’s full stage-dependent crop method.
          Root depths are displayed for learning and are not used to infer storage.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Family</th>
                <th>Legume</th>
                <th>Days</th>
                <th>Illustrative Kc</th>
                <th>Illustrative temperature</th>
                <th>Root trait</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(catalog?.crops || {}).map(([id, c]) => (
                <tr key={id}>
                  <td>{c.name}</td>
                  <td>{c.family}</td>
                  <td>{c.legume ? 'Yes' : 'No'}</td>
                  <td>{c.days}</td>
                  <td>{c.kc}</td>
                  <td>
                    {c.min_temp}–{c.max_temp}°C
                  </td>
                  <td>{c.root_m} m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
