'use client';
import { useState } from 'react';
import { Thermometer, Droplets, RotateCcw, FlaskConical, ArrowRight } from 'lucide-react';
import { useTerra } from '@/lib/store';
import { defaultScenario } from '@/lib/defaults';
import { Panel, PageIntro, Notice, Busy, fmt } from './UI';
import { ClimateChart, SeasonalComparison, StressCharts } from './Charts';
import { EnvironmentStats } from './Overview';
import { VegetationPanel } from './VegetationPanel';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export function ClimateLab() {
  const { scenario, setScenario, climate, analysis, activeRotation, catalog, setView } = useTerra();
  const [season, setSeason] = useState(0);
  const [metric, setMetric] = useState<'combined' | 'temperature' | 'water'>('combined');
  const data = climate.data;
  return (
    <>
      <PageIntro
        eyebrow="CLIMATE SCENARIO LABORATORY"
        title="Ask a different kind of “what if?”"
        description="Replay historical conditions. Shift temperature and rainfall. Watch the assumptions change the result."
      >
        <button className="button secondary" onClick={() => setScenario(defaultScenario)}>
          <RotateCcw size={15} />
          Reset scenario
        </button>
      </PageIntro>
      <div className="scenario-control">
        <div className="scenario-icon">
          <FlaskConical size={27} />
        </div>
        <div className="scenario-preset">
          <span className="eyebrow">BASE WEATHER REPLAY</span>
          <select
            aria-label="Climate replay scenario"
            value={scenario.kind}
            onChange={(e) =>
              setScenario({ ...scenario, kind: e.target.value as typeof scenario.kind })
            }
          >
            <option value="typical">Mean calendar of selected years</option>
            <option value="dry">Driest complete selected year</option>
            <option value="wet">Wettest complete selected year</option>
            <option value="custom">Custom perturbation of mean calendar</option>
          </select>
        </div>
        <label className="scenario-slider">
          <span>
            <Thermometer size={15} />
            Temperature shift
            <strong>
              {scenario.temperature_delta > 0 ? '+' : ''}
              {scenario.temperature_delta.toFixed(1)}°C
            </strong>
          </span>
          <input
            aria-label="Temperature shift"
            type="range"
            min={-5}
            max={8}
            step={0.5}
            value={scenario.temperature_delta}
            onChange={(e) => setScenario({ ...scenario, temperature_delta: +e.target.value })}
          />
        </label>
        <label className="scenario-slider">
          <span>
            <Droplets size={15} />
            Rainfall change
            <strong>
              {Math.round((scenario.rainfall_factor - 1) * 100) > 0 ? '+' : ''}
              {Math.round((scenario.rainfall_factor - 1) * 100)}%
            </strong>
          </span>
          <input
            aria-label="Rainfall change"
            type="range"
            min={0.2}
            max={2}
            step={0.05}
            value={scenario.rainfall_factor}
            onChange={(e) => setScenario({ ...scenario, rainfall_factor: +e.target.value })}
          />
        </label>
      </div>
      <Notice tone="warning">
        These are historical replays and hypothetical perturbations, not forecasts. Sliders affect
        crop-model results. Environmental charts below retain the original source record.{' '}
        {analysis.data?.replay_year && `Historical replay year: ${analysis.data.replay_year}.`}
      </Notice>
      {analysis.loading ? (
        <Busy text="Replaying your rotation under these conditions…" />
      ) : analysis.error ? (
        <Notice tone="error">{analysis.error}</Notice>
      ) : (
        analysis.data && (
          <div className="scenario-results">
            {analysis.data.rotations.map((r, i) => (
              <div className={i === 1 ? 'highlight' : ''} key={r.id}>
                <span className="eyebrow">{r.name}</span>
                <div className="scenario-number">
                  {fmt(r.score, 1)}
                  <small>/ 100</small>
                </div>
                <span>{fmt(r.water_deficit_mm)} mm unmet ET demand</span>
                <small>Worst fixed stress-test score: {fmt(r.robust_score, 1)}</small>
              </div>
            ))}
          </div>
        )
      )}
      <StressCharts />
      <div className="section-heading">
        <div>
          <span className="eyebrow">OBSERVE BEFORE YOU ASSUME</span>
          <h2>The environmental record</h2>
        </div>
        <div className="segmented">
          {(['combined', 'temperature', 'water'] as const).map((v) => (
            <button key={v} className={metric === v ? 'active' : ''} onClick={() => setMetric(v)}>
              {v === 'combined' ? 'Together' : v === 'water' ? 'Water' : 'Temperature'}
            </button>
          ))}
        </div>
      </div>
      <EnvironmentStats />
      <div className="two-col">
        <Panel title="Historical climate timeline" eyebrow="SOURCE RECORD · NOT SLIDER-ADJUSTED">
          {data ? (
            <>
              <ClimateChart data={data.monthly} kind={metric} />
              <small className="chart-note">
                Monthly rainfall and ET₀ totals are withheld for incomplete months. ET₀ is
                Hargreaves, uncalibrated, not measured evapotranspiration.
              </small>
            </>
          ) : (
            <Busy />
          )}
        </Panel>
        <Panel title="Temperature patterns, at a glance" eyebrow="MONTH × YEAR HEATMAP">
          {data && (
            <div className="climate-heatmap">
              <div className="heatmap-row">
                <span />
                {Array.from({ length: 12 }, (_, i) => (
                  <small key={i}>
                    {new Date(2024, i).toLocaleDateString('en', { month: 'narrow' })}
                  </small>
                ))}
              </div>
              {[...new Set(data.monthly.map((m) => m.month.slice(0, 4)))].map((y) => (
                <div className="heatmap-row" key={y}>
                  <span>{y}</span>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = data.monthly.find(
                      (x) => x.month === `${y}-${String(i + 1).padStart(2, '0')}`,
                    );
                    const t = m?.temperature;
                    const color =
                      t == null
                        ? '#e8e9df'
                        : `hsl(${Math.max(15, 150 - (t + 5) * 3)},35%,${Math.max(45, 85 - (t + 5) * 0.6)}%)`;
                    return (
                      <div
                        key={i}
                        style={{ background: color }}
                        title={`${y}-${i + 1}: ${t == null ? 'Unavailable' : `${t.toFixed(1)}°C`} · coverage ${Math.round((m?.coverage || 0) * 100)}%`}
                      >
                        <span>{t == null ? '—' : Math.round(t)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="heatmap-key">
                <span>Cooler</span>
                <i />
                <span>Warmer · °C</span>
              </div>
            </div>
          )}
          <p className="chart-note">
            Numbers show monthly air temperature, not a spatial field-level heatmap. Missing values
            remain empty.
          </p>
          <div className="unavailable-metrics">
            <div>
              <strong>Soil moisture</strong>
              <span>No SMAP observations connected</span>
            </div>
            <div>
              <strong>Vegetation condition</strong>
              <span>MODIS quality timeline below</span>
            </div>
          </div>
        </Panel>
      </div>
      <SeasonalComparison />
      <VegetationPanel />
      <div className="two-col">
        <Panel title="Departures within your selected record" eyebrow="ANOMALY CHECK">
          {data?.anomalies.some((a) => a.departure !== null) ? (
            <>
              <div className="chart">
                <ResponsiveContainer>
                  <LineChart data={data.anomalies} margin={{ left: -20, right: 15 }}>
                    <CartesianGrid stroke="#e9ece2" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} minTickGap={35} />
                    <YAxis unit="°C" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      dataKey="departure"
                      name="Temperature departure (°C)"
                      dot={false}
                      stroke="#b08154"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                {data.anomaly_note} A three-year baseline is too short to establish a climatological
                normal or trend.
              </p>
            </>
          ) : (
            <Notice>
              Choose at least three complete years to compare same-month departures. No long-term
              climate anomaly is inferred.
            </Notice>
          )}
        </Panel>
        <Panel
          title="Inside the soil-water bucket"
          eyebrow="DERIVED · EDUCATIONAL ILLUSTRATION"
          action={
            <select
              aria-label="Water balance season"
              value={season}
              onChange={(e) => setSeason(+e.target.value)}
            >
              {activeRotation?.seasons.map((s, i) => (
                <option value={i} key={i}>
                  S{s.slot} · {catalog?.crops[s.crop].name}
                </option>
              ))}
            </select>
          }
        >
          {activeRotation ? (
            <>
              <div className="chart">
                <ResponsiveContainer>
                  <LineChart
                    data={activeRotation.seasons[season].trace}
                    margin={{ left: -20, right: 15 }}
                  >
                    <CartesianGrid stroke="#e9ece2" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis unit=" mm" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line
                      dataKey="storage_mm"
                      name="Stored plant-available water"
                      stroke="#487252"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      dataKey="deficit_mm"
                      name="Daily unmet ET demand"
                      stroke="#c69363"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                {activeRotation.name}, sampled every seven days. Storage is modeled from farmer
                inputs and weather; it is not observed soil moisture.
              </p>
            </>
          ) : (
            <Notice>Select a valid rotation to inspect its water balance.</Notice>
          )}
        </Panel>
      </div>
      <div className="section-end">
        <span>Use local weather and crop observations to challenge the model.</span>
        <button className="button primary" onClick={() => setView('evidence')}>
          Inspect assumptions
          <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
}
