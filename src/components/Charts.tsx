'use client';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  BarChart,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from 'recharts';
import { useTerra } from '@/lib/store';
import { Panel, Notice } from './UI';
import type { Monthly } from '@/lib/types';
const axis = { fontSize: 10, fill: '#7d8275' };
const grid = '#eceee6';
export function ClimateChart({
  data,
  kind = 'combined',
}: {
  data: Monthly[];
  kind?: 'combined' | 'temperature' | 'water';
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="month"
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              new Date(`${v}-01T00:00:00`).toLocaleDateString('en', {
                month: 'short',
                year: '2-digit',
              })
            }
            minTickGap={25}
          />
          <YAxis
            yAxisId="water"
            tick={axis}
            axisLine={false}
            tickLine={false}
            unit=" mm"
            hide={kind === 'temperature'}
          />
          <YAxis
            yAxisId="temp"
            orientation={kind === 'temperature' ? 'left' : 'right'}
            tick={axis}
            axisLine={false}
            tickLine={false}
            unit="°"
            domain={['auto', 'auto']}
            hide={kind === 'water'}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e1e5d8', fontSize: 12 }}
            labelFormatter={(v) => String(v)}
          />
          {kind !== 'temperature' && (
            <Bar
              yAxisId="water"
              name="Rainfall (mm)"
              dataKey="precipitation"
              fill="#a9bd9d"
              radius={[3, 3, 0, 0]}
              maxBarSize={20}
            />
          )}
          {kind === 'water' && (
            <Line
              yAxisId="water"
              name="Estimated ET₀ (mm)"
              dataKey="eto"
              stroke="#cb965d"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          )}
          {kind !== 'water' && (
            <Line
              yAxisId="temp"
              name="Mean temperature (°C)"
              dataKey="temperature"
              stroke="#c58d57"
              strokeWidth={2.3}
              dot={false}
              connectNulls={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
export function ComparisonCharts() {
  const { analysis } = useTerra();
  const data = analysis.data;
  if (!data) return null;
  return (
    <div className="two-col">
      <Panel title="The shape of the trade-off" eyebrow="MULTI-CRITERIA COMPARISON">
        <div className="chart tall">
          <ResponsiveContainer>
            <BarChart
              data={data.rotations.map((r) => ({
                name:
                  r.id === 'existing'
                    ? 'Existing'
                    : r.id === 'balanced'
                      ? 'Priority-led'
                      : 'Water-lean',
                ...r.metrics,
              }))}
              margin={{ left: -20, right: 10 }}
            >
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={axis} axisLine={false} />
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="water" name="Water adequacy" fill="#426c52" radius={[3, 3, 0, 0]} />
              <Bar
                dataKey="diversity"
                name="Rotation diversity"
                fill="#a9bd79"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="suitability"
                name="Temperature fit"
                fill="#dab583"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <small className="chart-note">
          All axes are educational indices (0–100), not yield or probability.
        </small>
      </Panel>
      <Panel title="Feasible trade-offs" eyebrow="PARETO EXPLORATION">
        <div className="chart tall">
          <ResponsiveContainer>
            <ScatterChart margin={{ left: -10, right: 20, bottom: 15 }}>
              <CartesianGrid stroke={grid} />
              <XAxis
                type="number"
                dataKey="water"
                domain={[0, 100]}
                name="Water adequacy"
                tick={axis}
                label={{ value: 'Water adequacy →', position: 'bottom', fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="diversity"
                domain={[0, 100]}
                name="Diversity"
                tick={axis}
              />
              <ZAxis dataKey="score" range={[40, 130]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="chart-tooltip">
                      {payload[0].payload.sequence.join(' → ')}
                      <br />
                      Water: {payload[0].payload.water} · Diversity: {payload[0].payload.diversity}
                    </div>
                  ) : null
                }
              />
              <Scatter data={data.frontier} fill="#6b8a57" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <small className="chart-note">
          {data.frontier_total} distinct nondominated metric combinations among{' '}
          {data.candidate_count} feasible alternatives; up to 40 shown. Temperature fit is the third
          objective.
        </small>
      </Panel>
    </div>
  );
}
export function StressCharts() {
  const { analysis } = useTerra();
  const data = analysis.data;
  if (!data) return null;
  const rows = data.rotations[0].stress.map((s, i) => ({
    scenario: s.scenario,
    ...Object.fromEntries(data.rotations.map((r) => [r.id, r.stress[i].score])),
  }));
  const sens = data.rotations[0].sensitivity.map((s, i) => ({
    delta: `${s.delta > 0 ? '+' : ''}${s.delta}°C`,
    ...Object.fromEntries(data.rotations.map((r) => [r.id, r.sensitivity[i].score])),
  }));
  return (
    <div className="two-col">
      <Panel title="How does each strategy hold up?" eyebrow="FIXED HYPOTHETICAL STRESS TESTS">
        <div className="chart tall">
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ left: -20, right: 15 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="scenario" tick={axis} axisLine={false} />
              <YAxis domain={[0, 100]} tick={axis} axisLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {data.rotations.map((r, i) => (
                <Line
                  key={r.id}
                  dataKey={r.id}
                  name={i === 0 ? 'Existing' : i === 1 ? 'Priority-led' : 'Water-lean'}
                  stroke={['#bc9b75', '#31583c', '#a1b76c'][i]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <small className="chart-note">
          Absolute perturbations from the selected replay calendar. Does not stack custom sliders.
          Worst-case score is the minimum of these four tests.
        </small>
      </Panel>
      <Panel title="Temperature sensitivity" eyebrow="CHANGE ONE ASSUMPTION">
        <div className="chart tall">
          <ResponsiveContainer>
            <LineChart data={sens} margin={{ left: -20, right: 15 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="delta" tick={axis} axisLine={false} />
              <YAxis domain={[0, 100]} tick={axis} axisLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {data.rotations.map((r, i) => (
                <Line
                  key={r.id}
                  dataKey={r.id}
                  name={i === 0 ? 'Existing' : i === 1 ? 'Priority-led' : 'Water-lean'}
                  stroke={['#bc9b75', '#31583c', '#a1b76c'][i]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <small className="chart-note">
          Air temperature shifted uniformly; selected rainfall factor held constant. This shows
          model sensitivity, not a calibrated uncertainty band.
        </small>
      </Panel>
    </div>
  );
}
export function SeasonalComparison() {
  const { climate } = useTerra();
  if (!climate.data) return null;
  const years = [...new Set(climate.data.monthly.map((m) => m.month.slice(0, 4)))];
  const rows = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0');
    return {
      month: new Date(2024, i).toLocaleDateString('en', { month: 'short' }),
      ...Object.fromEntries(
        years.map((y) => [
          y,
          climate.data!.monthly.find((m) => m.month === `${y}-${mm}`)?.precipitation ?? null,
        ]),
      ),
    };
  });
  return (
    <Panel title="Rainfall, season against season" eyebrow="SELECTED YEARS">
      <div className="chart tall">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ left: -20, right: 20 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="month" tick={axis} axisLine={false} />
            <YAxis unit=" mm" tick={axis} axisLine={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {years.map((y, i) => (
              <Line
                key={y}
                name={y}
                dataKey={y}
                stroke={['#31583c', '#a5b876', '#cb985b', '#799da0', '#b59ac3'][i % 5]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
