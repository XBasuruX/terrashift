'use client';
import { useState } from 'react';
import {
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ClipboardPlus,
  CopyPlus,
  Grid2X2,
  Layers,
  List,
  Map,
  Pencil,
  Plus,
  Tractor,
  X,
} from 'lucide-react';
import { ParcelPreview } from './ParcelPreview';
import { exportBoundaries, inCuneo, inSriLanka } from './parcels';
import type { XFarmField } from './xfarmData';

interface Props {
  fields: XFarmField[];
  groups: string[];
  it: boolean;
  onGroup: (name: string, previous?: string) => void;
  onOpen: (field: XFarmField) => void;
  onActivity: (field: XFarmField) => void;
  onCreate: () => void;
}

export function FieldGallery({ fields, groups, it, onGroup, onOpen, onActivity, onCreate }: Props) {
  const [list, setList] = useState(false);
  const [menu, setMenu] = useState(false);
  const [stats, setStats] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const ordered = [...new Set([...groups, ...fields.map((f) => f.group)])];
  const beginGroup = (group: string) => {
    setMenu(false);
    setName(group);
    setEditing(group);
  };
  const validName =
    name.trim() &&
    (name.trim() === editing ||
      !ordered.some((g) => g.toLowerCase() === name.trim().toLowerCase()));

  return (
    <section className="parcel-workspace">
      <div className="parcel-scroll">
        <div className="parcel-heading">
          <div>
            <h1>
              <Layers />
              {it ? 'I tuoi campi' : 'Your fields'}
            </h1>
            <p>
              {fields.length}{' '}
              {it
                ? fields.length === 1
                  ? 'Campo'
                  : 'Campi'
                : fields.length === 1
                  ? 'field'
                  : 'fields'}
            </p>
          </div>
          <button className="parcel-outline" aria-expanded={stats} onClick={() => setStats(!stats)}>
            <ChartNoAxesColumn size={15} />
            {it ? 'Statistiche' : 'Statistics'}
          </button>
        </div>
        {stats && (
          <dl className="parcel-stats">
            <div>
              <dt>{it ? 'Area totale' : 'Total area'}</dt>
              <dd>{fields.reduce((sum, f) => sum + f.surface_ha, 0).toFixed(2)} ha</dd>
            </div>
            <div>
              <dt>{it ? 'Gruppi' : 'Groups'}</dt>
              <dd>{ordered.length}</dd>
            </div>
            <div>
              <dt>{it ? 'Colture' : 'Crops'}</dt>
              <dd>{new Set(fields.map((f) => f.currentCrop)).size}</dd>
            </div>
          </dl>
        )}
        <div className="parcel-switch">
          <button aria-pressed={!list} onClick={() => setList(false)}>
            <Grid2X2 size={14} />
            {it ? 'Griglia' : 'Grid'}
          </button>
          <button aria-pressed={list} onClick={() => setList(true)}>
            <List size={15} />
            {it ? 'Lista' : 'List'}
          </button>
        </div>
        {ordered.map((group) => {
          const members = fields.filter((f) => f.group === group);
          const open = !collapsed.includes(group);
          return (
            <section key={group} className="parcel-group">
              <header>
                <button
                  className="parcel-group-name"
                  aria-expanded={open}
                  onClick={() =>
                    setCollapsed(
                      open ? [...collapsed, group] : collapsed.filter((g) => g !== group),
                    )
                  }
                >
                  <Map size={17} />
                  {group}
                  <ChevronDown size={15} className={open ? 'expanded' : ''} />
                </button>
                <button
                  className="parcel-edit"
                  aria-label={(it ? 'Rinomina ' : 'Rename ') + group}
                  onClick={() => beginGroup(group)}
                >
                  <Pencil size={14} />
                </button>
              </header>
              {open && (
                <div className={list ? 'parcel-list' : 'parcel-grid'}>
                  {members.map((field) => (
                    <article key={field.id} className="parcel-card">
                      <button
                        className="parcel-open"
                        onClick={() => onOpen(field)}
                        aria-label={field.name}
                      >
                        <span className="parcel-thumb">
                          <ParcelPreview field={field} />
                          <span>
                            {field.currentCrop}
                            {field.currentVariety && <small>{field.currentVariety}</small>}
                          </span>
                        </span>
                        <span className="parcel-caption">
                          {field.name}
                          <small>{field.surface_ha.toFixed(2)} ha</small>
                        </span>
                      </button>
                      <button className="parcel-log" onClick={() => onActivity(field)}>
                        <ClipboardPlus size={14} />
                        {it ? 'Traccia attività' : 'Track activity'}
                      </button>
                    </article>
                  ))}
                  {!members.length && (
                    <p>{it ? 'Nessun campo in questo gruppo.' : 'No fields in this group.'}</p>
                  )}
                </div>
              )}
            </section>
          );
        })}
        <small className="parcel-credit">
          {fields.some((f) => inCuneo(f.center)) &&
            'Ortofoto ICE 2010 · © Arpa Piemonte · CC BY 2.5 IT'}{' '}
          {fields.some((f) => inSriLanka(f.center)) && 'NASA Blue Marble · regional context'}
        </small>
      </div>
      {menu && (
        <button
          className="parcel-scrim"
          aria-label={it ? 'Chiudi menu' : 'Close menu'}
          onClick={() => setMenu(false)}
        />
      )}
      <div className="parcel-actions">
        {menu && (
          <>
            <button
              disabled={!fields.some((f) => f.coordinates.length >= 3)}
              onClick={() => {
                exportBoundaries(fields);
                setMenu(false);
              }}
            >
              <span>{it ? 'Esporta per macchinario' : 'Export for machinery'}</span>
              <Tractor />
            </button>
            <button onClick={onCreate}>
              <span>{it ? 'Nuovo Campo' : 'New field'}</span>
              <Map />
            </button>
            <button onClick={() => beginGroup('')}>
              <span>{it ? 'Crea gruppo' : 'Create group'}</span>
              <CopyPlus />
            </button>
          </>
        )}
        <button
          className="parcel-plus"
          aria-label={it ? 'Azioni campi' : 'Field actions'}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Plus />}
        </button>
      </div>
      {editing !== null && (
        <div className="xfarm-modal-backdrop">
          <form
            className="parcel-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!validName) return;
              onGroup(name.trim(), editing || undefined);
              setEditing(null);
            }}
          >
            <label>
              {it ? 'Nome gruppo' : 'Group name'}
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div>
              <button type="button" onClick={() => setEditing(null)}>
                {it ? 'Annulla' : 'Cancel'}
              </button>
              <button disabled={!validName}>
                <Check size={15} />
                {it ? 'Salva' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
