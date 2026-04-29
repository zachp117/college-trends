import { useEffect, useState } from 'react';
import type { DegreeLevel, SearchFilters } from '../api/scorecard';
import { US_STATES } from '../data/states';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  initial: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  loading: boolean;
}

export function Filters({ initial, onApply, loading }: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [state, setState] = useState(initial.state ?? '');
  const [ownership, setOwnership] = useState<number[]>(initial.ownership ?? []);
  const [minSize, setMinSize] = useState<string>(initial.minSize?.toString() ?? '');
  const [maxSize, setMaxSize] = useState<string>(initial.maxSize?.toString() ?? '');
  const [degreeLevels, setDegreeLevels] = useState<number[]>(initial.degreeLevels ?? []);

  // Sync local form state when the parent updates `initial` (e.g., user clicked
  // a starter preset chip).
  const initialKey = JSON.stringify(initial);
  useEffect(() => {
    setName(initial.name ?? '');
    setState(initial.state ?? '');
    setOwnership(initial.ownership ?? []);
    setMinSize(initial.minSize?.toString() ?? '');
    setMaxSize(initial.maxSize?.toString() ?? '');
    setDegreeLevels(initial.degreeLevels ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const toggleOwnership = (v: number) => {
    setOwnership((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  };
  const toggleDegree = (v: number) => {
    setDegreeLevels((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      name: name.trim() || undefined,
      state: state || undefined,
      ownership: ownership.length > 0 ? (ownership as (1 | 2 | 3)[]) : undefined,
      minSize: minSize ? Number(minSize) : undefined,
      maxSize: maxSize ? Number(maxSize) : undefined,
      degreeLevels:
        degreeLevels.length > 0 ? (degreeLevels as DegreeLevel[]) : undefined,
    });
  };

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
    }`;

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 gap-4 md:grid-cols-5 items-end bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
    >
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Search by name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Stanford"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Size (students)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={minSize}
            onChange={(e) => setMinSize(e.target.value)}
            placeholder="Min"
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            value={maxSize}
            onChange={(e) => setMaxSize(e.target.value)}
            placeholder="Max"
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">Ownership</label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 1, label: 'Public' },
            { v: 2, label: 'Private nonprofit' },
            { v: 3, label: 'Private for-profit' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => toggleOwnership(o.v)}
              className={chipClass(ownership.includes(o.v))}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Predominant degree{' '}
          <InfoTooltip term="predominant-degree" />
          <span className="text-slate-400 font-normal ml-1">(none = all)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 1, label: 'Certificate' },
            { v: 2, label: 'Associate' },
            { v: 3, label: "Bachelor's" },
            { v: 4, label: 'Graduate' },
          ].map((d) => (
            <button
              key={d.v}
              type="button"
              onClick={() => toggleDegree(d.v)}
              className={chipClass(degreeLevels.includes(d.v))}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm font-medium py-2"
        >
          {loading ? 'Loading…' : 'Apply filters'}
        </button>
      </div>
    </form>
  );
}
