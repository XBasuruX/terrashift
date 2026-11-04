'use client';
import { useState, useEffect } from 'react';
import { useTerra, useResource } from '@/lib/store';
import { Panel, Notice, Busy, LinkOut } from './UI';
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
type Vegetation = {
  records: {
    date: string;
    ndvi: number | null;
    raw_ndvi: number | null;
    accepted: boolean;
    pixel_reliability: number | null;
    vi_quality: number | null;
  }[];
  mode: string;
  source: string;
  accepted?: number;
  rejected?: number;
  warning?: string;
  quality_rule?: string;
  resolution?: string;
  temporal?: string;
  retrieved_at?: string;
  note?: string;
};
export function VegetationPanel() {
  const { farm, start, end, mode } = useTerra();
  const [live, setLive] = useState(false);
  const key = JSON.stringify({
    latitude: farm.latitude,
    longitude: farm.longitude,
    start,
    end,
    mode,
  });
  useEffect(() => setLive(false), [key]);
  const state = useResource<Vegetation>('vegetation', {
    latitude: farm.latitude,
    longitude: farm.longitude,
    start,
    end,
    mode: live ? 'live' : mode === 'simulation' ? 'simulation' : 'cached',
  });
  const d = state.data;
  return (
    <Panel
      title="Vegetation, with the quality visible"
      eyebrow="MODIS MOD13Q1 / ORNL DAAC · INDEPENDENT DATA LAYER"
      action={
        <button
          className="button secondary"
          onClick={() => setLive(true)}
          disabled={state.loading || live}
        >
          Request live NDVI
        </button>
      }
    >
      {state.loading ? (
        <Busy text="Reading MODIS composites and quality flags…" />
      ) : state.error ? (
        <Notice tone="error">{state.error}</Notice>
      ) : d?.records.length ? (
        <>
          <div className="inline-actions">
            <span className="badge green">
              {d.mode} · {d.accepted} accepted composites
            </span>
            <span className="badge amber">{d.rejected} screened out</span>
            <span className="subtle">Nominal 250 m · dimensionless NDVI · 16-day composite</span>
          </div>
          <div className="chart tall">
            <ResponsiveContainer>
              <LineChart data={d.records} margin={{ left: -10, right: 20, top: 25 }}>
                <CartesianGrid stroke="#e7ecdf" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8e9c80' }} minTickGap={50} />
                <YAxis domain={[-0.2, 1]} tick={{ fontSize: 10, fill: '#8e9c80' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line
                  dataKey="raw_ndvi"
                  name="Unscreened valid-range NDVI (context only)"
                  stroke="#c9d0b9"
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  dataKey="ndvi"
                  name="Accepted NDVI"
                  stroke="#557b42"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-note">
            {d.quality_rule} Gray values failed the strict screen and are not used as trusted
            observations. Gaps are not interpolated.
          </p>
          <p className="body-copy">
            {d.note} Surface vegetation patterns are not a direct measurement of crop stress,
            nutrients or yield.
          </p>
          <small className="chart-note">
            Composite start dates are shown. Source: {d.source}; retrieved {d.retrieved_at}.
          </small>
        </>
      ) : (
        <Notice>
          {d?.warning || 'No genuine vegetation observations loaded.'} No synthetic vegetation
          values are substituted.
        </Notice>
      )}
      {d?.warning && d.records.length > 0 && <Notice tone="warning">{d.warning}</Notice>}
      <LinkOut href="https://modis.ornl.gov/rst/">Inspect the official subset service</LinkOut>
    </Panel>
  );
}
