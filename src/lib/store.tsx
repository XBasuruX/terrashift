'use client';
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { defaultFarm, defaultScenario } from './defaults';
import type { Farm, Scenario, Mode, Climate, Catalog, Analysis, View } from './types';
import { post } from './api';
import { isSavedFarm } from './validation';
import { stableJSON } from './stable';
import { DEFAULT_CATALOG } from './catalogData';

export function useResource<T>(endpoint: string, body: unknown, enabled = true) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: enabled,
    error: null,
  });
  const key = JSON.stringify(body);
  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    const timer = setTimeout(
      () =>
        post<T>(endpoint, JSON.parse(key), controller.signal)
          .then((data) => setState({ data, loading: false, error: null }))
          .catch((e) => {
            if (!controller.signal.aborted)
              setState({ data: null, loading: false, error: e.message });
          }),
      450,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, key, enabled]);
  return state;
}

function useTerraState() {
  const [farm, setFarm] = useState<Farm>(defaultFarm);
  const [savedFarms, setSavedFarms] = useState<Farm[]>([defaultFarm]);
  const [scenario, setScenario] = useState<Scenario>(defaultScenario);
  const [mode, setMode] = useState<Mode>('cached');
  const [start, setStart] = useState('2023-01-01');
  const [end, setEnd] = useState('2025-12-31');
  const [view, setView] = useState<View>('overview');
  const [learning, setLearning] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(DEFAULT_CATALOG);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selected, setSelected] = useState('balanced');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('terrashift-v1');
      if (saved) {
        const s = JSON.parse(saved);
        const f = s.farm;
        if (isSavedFarm(f)) {
          setFarm({ ...defaultFarm, ...f });
        } else setStorageWarning('Saved configuration was invalid. The sample farm was restored.');
        setLearning(Boolean(s.learning));
      }
    } catch {
      setStorageWarning('Saved configuration could not be read. The sample farm was restored.');
    }
    setHydrated(true);
    try {
      const saved = JSON.parse(localStorage.getItem('terrashift-farms-v2') || 'null');
      if (saved?.farms?.length) {
        const valid = saved.farms.filter(isSavedFarm).map((f: Farm) => ({
          ...f,
          id: f.id || crypto.randomUUID(),
          category: f.category || 'Sri Lanka pilot',
          boundary: f.boundary || [],
        }));
        if (valid.length) {
          setSavedFarms(valid);
          setFarm(valid.find((f: Farm) => f.id === saved.active) || valid[0]);
        }
      }
    } catch {
      setStorageWarning('Farm library could not be read; using the sample.');
    }
    fetch('/api/catalog')
      .then((r) => {
        if (!r.ok) return DEFAULT_CATALOG;
        return r.json();
      })
      .then(setCatalog)
      .catch(() => setCatalog(DEFAULT_CATALOG));
  }, []);
  useEffect(() => {
    if (hydrated)
      try {
        localStorage.setItem('terrashift-v1', JSON.stringify({ farm, learning }));
      } catch {
        setStorageWarning('Browser storage is unavailable; this session is not saved.');
      }
  }, [farm, learning, hydrated]);
  const farms = savedFarms.some((f) => f.id === farm.id)
    ? savedFarms.map((f) => (f.id === farm.id ? farm : f))
    : [...savedFarms, farm];
  useEffect(() => {
    if (hydrated)
      try {
        localStorage.setItem('terrashift-farms-v2', JSON.stringify({ farms, active: farm.id }));
      } catch {
        setStorageWarning('Farm library could not be saved.');
      }
  }, [JSON.stringify(farms), farm.id, hydrated]);
  const selectFarm = (id: string) => {
    const next = farms.find((f) => f.id === id);
    if (next) {
      setSavedFarms(farms);
      setFarm(next);
      setCustomAnalysis(null);
    }
  };
  const addFarm = (patch: Partial<Farm>, destination: View = 'farm') => {
    const next = {
      ...structuredClone(defaultFarm),
      id: crypto.randomUUID(),
      name: `Farm ${farms.length + 1}`,
      boundary: [],
      ...patch,
    };
    setSavedFarms([...farms, next]);
    setFarm(next);
    setView(destination);
  };
  const query = useMemo(
    () => ({ latitude: farm.latitude, longitude: farm.longitude, start, end, mode }),
    [farm.latitude, farm.longitude, start, end, mode],
  );
  const climate = useResource<Climate>('climate', query, hydrated);
  const generatedAnalysis = useResource<Analysis>(
    'analyze',
    { farm, climate: query, scenario },
    hydrated && Boolean(climate.data),
  );
  const [customAnalysis, setCustomAnalysis] = useState<Analysis | null>(null);
  const configKey = JSON.stringify({ farm, query, scenario });
  useEffect(() => setCustomAnalysis(null), [configKey]);
  const validCustom =
    customAnalysis &&
    stableJSON(customAnalysis.farm) === stableJSON(farm) &&
    stableJSON(customAnalysis.scenario) === stableJSON(scenario) &&
    customAnalysis.provenance.start === start &&
    customAnalysis.provenance.end === end &&
    customAnalysis.provenance.requested_mode === mode
      ? customAnalysis
      : null;
  const analysis = { ...generatedAnalysis, data: validCustom || generatedAnalysis.data };
  const updateFarm = (patch: Partial<Farm>) =>
    setFarm((prev) => ({
      ...prev,
      ...((patch.latitude !== undefined || patch.longitude !== undefined) &&
      patch.boundary === undefined
        ? { boundary: [] }
        : {}),
      ...patch,
    }));
  const activeRotation =
    analysis.data?.rotations.find((r) => r.id === selected) || analysis.data?.rotations[0];
  return {
    farms,
    selectFarm,
    addFarm,
    farm,
    setFarm,
    updateFarm,
    scenario,
    setScenario,
    mode,
    setMode,
    start,
    setStart,
    end,
    setEnd,
    view,
    setView,
    learning,
    setLearning,
    catalog,
    catalogError,
    climate,
    analysis,
    selected,
    setSelected,
    activeRotation,
    storageWarning,
    customAnalysis,
    setCustomAnalysis,
  };
}
const Context = createContext<ReturnType<typeof useTerraState> | null>(null);
export function TerraProvider({ children }: { children: ReactNode }) {
  const state = useTerraState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useTerra() {
  const state = useContext(Context);
  if (!state) throw Error('TerraProvider missing');
  return state;
}
