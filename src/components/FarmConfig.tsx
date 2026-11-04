'use client';
import { MapPin, Sprout, Droplets, Tractor, ArrowRight, RotateCcw } from 'lucide-react';
import { useTerra } from '@/lib/store';
import { defaultFarm } from '@/lib/defaults';
import { Panel, PageIntro, Notice } from './UI';
import { FarmPicker } from './Overview';
import { FieldDetail } from './FieldDetail';

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {unit && <small>{unit}</small>}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = e.currentTarget.valueAsNumber;
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
    </label>
  );
}
export function PriorityControls() {
  const { farm, updateFarm } = useTerra();
  const total = Object.values(farm.priorities).reduce((a, b) => a + b, 0);
  const names = {
    water: 'Water adequacy',
    diversity: 'Rotation diversity',
    suitability: 'Temperature fit',
  };
  return (
    <div className="priority-controls">
      {(Object.keys(names) as (keyof typeof names)[]).map((k) => (
        <label key={k}>
          <div>
            <span>{names[k]}</span>
            <strong>
              {Math.round((farm.priorities[k] / Math.max(1, total)) * 100)}
              <small>% weight</small>
            </strong>
          </div>
          <input
            aria-label={`${names[k]} priority`}
            type="range"
            min={0}
            max={100}
            value={farm.priorities[k]}
            onChange={(e) =>
              updateFarm({ priorities: { ...farm.priorities, [k]: +e.target.value } })
            }
          />
        </label>
      ))}
      {total === 0 && <Notice tone="error">At least one priority must be positive.</Notice>}
      <small>
        Relative weights normalize to one. These express preferences, not scientific importance.
      </small>
    </div>
  );
}
export function FarmConfig() {
  const { farm, updateFarm, setFarm, catalog, setView } = useTerra();
  const crops = catalog?.crops || {};
  return (
    <>
      <PageIntro
        eyebrow="MY FARM / SCENARIO INPUTS"
        title="Your land. Your constraints. Your priorities."
        description="Farmer-entered assumptions stay with you across the application and are saved in this browser."
      >
        <button
          className="button secondary"
          onClick={() => {
            if (window.confirm('Reset your farm configuration to the Anuradhapura sample?'))
              setFarm(defaultFarm);
          }}
        >
          <RotateCcw size={14} />
          Restore sample
        </button>
      </PageIntro>
      <FieldDetail key={farm.id} />
      <Notice>
        All fields here are farmer-entered scenario assumptions. Soil properties and irrigation are
        not inferred from satellite observations.
      </Notice>
      <div className="two-col">
        <Panel title="Place & profile" eyebrow="01 / DEFINE THE FARM">
          <FarmPicker />
          <div className="form-grid">
            <label className="field full">
              <span>Farm name</span>
              <input
                value={farm.name}
                maxLength={100}
                onChange={(e) => updateFarm({ name: e.target.value })}
              />
            </label>
            <NumberField
              label="Latitude"
              value={farm.latitude}
              onChange={(latitude) => updateFarm({ latitude })}
              min={-85}
              max={85}
              step={0.0001}
              unit="degrees"
            />
            <NumberField
              label="Longitude"
              value={farm.longitude}
              onChange={(longitude) => updateFarm({ longitude })}
              min={-180}
              max={180}
              step={0.0001}
              unit="degrees"
            />
            <NumberField
              label="Farm area"
              value={farm.area_ha}
              onChange={(area_ha) => updateFarm({ area_ha })}
              min={0.1}
              max={100000}
              step={0.1}
              unit="ha"
            />
            <label className="field">
              <span>Soil texture</span>
              <select
                value={farm.soil}
                onChange={(e) => updateFarm({ soil: e.target.value as typeof farm.soil })}
              >
                <option value="sandy">Sandy</option>
                <option value="loam">Loam</option>
                <option value="clay">Clay</option>
              </select>
            </label>
          </div>
          <small className="form-note">
            Texture is contextual. Enter plant-available storage below; texture is not automatically
            translated into hydraulic properties.
          </small>
        </Panel>
        <Panel title="Water & growing season" eyebrow="02 / SET THE BOUNDARIES">
          <div className="form-grid">
            <NumberField
              label="Plant-available soil storage"
              value={farm.available_water_mm}
              onChange={(available_water_mm) => updateFarm({ available_water_mm })}
              min={20}
              max={300}
              unit="mm / root zone"
            />
            <NumberField
              label="Irrigation allocation"
              value={farm.irrigation_mm}
              onChange={(irrigation_mm) => updateFarm({ irrigation_mm })}
              min={0}
              max={1000}
              unit="mm / season"
            />
            <label className="field">
              <span>First planting month</span>
              <select
                value={farm.season_start_month}
                onChange={(e) => updateFarm({ season_start_month: +e.target.value })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(2025, i).toLocaleDateString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="Available growing window"
              value={farm.season_length_days}
              onChange={(season_length_days) => updateFarm({ season_length_days })}
              min={60}
              max={180}
              unit="days"
            />
            <label className="field full">
              <span>Field preparation & equipment</span>
              <select
                value={farm.equipment}
                onChange={(e) => updateFarm({ equipment: e.target.value as typeof farm.equipment })}
              >
                <option value="paddy">Paddy preparation and standard equipment</option>
                <option value="standard">Standard equipment only</option>
              </select>
            </label>
          </div>
          <small className="form-note">
            Four planting slots begin six months apart. Each modeled season starts at 50% soil
            storage. Irrigation is distributed uniformly.
          </small>
        </Panel>
        <Panel title="The sequence you know" eyebrow="03 / ESTABLISH A BASELINE">
          <label className="field">
            <span>Crop immediately before this rotation</span>
            <select
              value={farm.previous_crop}
              onChange={(e) => updateFarm({ previous_crop: e.target.value })}
            >
              {Object.entries(crops).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            {farm.existing.map((c, i) => (
              <label className="field" key={i}>
                <span>Season {i + 1}</span>
                <select
                  value={c}
                  onChange={(e) => {
                    const existing = [...farm.existing];
                    existing[i] = e.target.value;
                    updateFarm({ existing });
                  }}
                >
                  {Object.entries(crops).map(([id, crop]) => (
                    <option key={id} value={id}>
                      {crop.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="field">
            <span>Crops to consider in alternatives</span>
          </label>
          <div className="crop-checkboxes">
            {Object.entries(crops).map(([id, c]) => (
              <label key={id} className={farm.allowed_crops.includes(id) ? 'checked' : ''}>
                <input
                  type="checkbox"
                  checked={farm.allowed_crops.includes(id)}
                  onChange={(e) => {
                    const allowed_crops = e.target.checked
                      ? [...farm.allowed_crops, id]
                      : farm.allowed_crops.filter((x) => x !== id);
                    if (allowed_crops.length) updateFarm({ allowed_crops });
                  }}
                />
                <span style={{ background: c.color }} />
                {c.name}
              </label>
            ))}
          </div>
        </Panel>
        <Panel title="What matters most to you?" eyebrow="04 / MAKE TRADE-OFFS VISIBLE">
          <PriorityControls />
          <label className="field">
            <span>Markets, costs & local constraints</span>
            <textarea
              value={farm.market_note}
              maxLength={1000}
              rows={3}
              onChange={(e) => updateFarm({ market_note: e.target.value })}
            />
          </label>
          <small className="form-note">
            Market notes appear in your decision brief. Economic feasibility is not scored: local
            prices, costs, yields and buyers are not available.
          </small>
          <button className="button primary" onClick={() => setView('rotations')}>
            Compare my rotations
            <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
    </>
  );
}
