import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { OWNERSHIP_LABELS } from '../../api/scorecard';
import { MAJOR_METRICS, schoolPath, type MajorMetric, type MajorRow } from '../../seo/majorContent';

type SortKey = 'name' | 'state' | MajorMetric;

const COLUMNS: MajorMetric[] = ['awards', 'e1', 'e5', 'debt'];
const PAGE = 50;

/** Every college offering the major. Starts sorted by degrees awarded. */
export function MajorTable({ rows }: { rows: MajorRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('awards');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q))
      : [...rows];
    const sign = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'name' || sortKey === 'state') {
        return sign * a[sortKey].localeCompare(b[sortKey]) || a.name.localeCompare(b.name);
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return a.name.localeCompare(b.name);
      if (av === null) return 1;
      if (bv === null) return -1;
      return sign * (av - bv) || a.name.localeCompare(b.name);
    });
    return list;
  }, [rows, sortKey, dir, query]);

  const visible = showAll ? sorted : sorted.slice(0, PAGE);

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setDir(dir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setDir(k === 'name' || k === 'state' ? 'asc' : 'desc');
    }
  };

  const header = (k: SortKey, label: string, align: 'left' | 'right', title?: string) => (
    <th
      key={k}
      scope="col"
      className={`px-3 py-2 font-medium whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
      aria-sort={sortKey === k ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => sortBy(k)}
        title={title}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${sortKey === k ? 'text-slate-900' : ''}`}
      >
        {label}
        {sortKey === k &&
          (dir === 'asc' ? (
            <ArrowUp size={12} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ArrowDown size={12} strokeWidth={1.75} aria-hidden="true" />
          ))}
      </button>
    </th>
  );

  return (
    <div>
      <div className="mb-3">
        <label className="sr-only" htmlFor="major-filter">
          Filter colleges by name or city
        </label>
        <input
          id="major-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or city"
          className="w-full sm:w-72 text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {header('name', 'College', 'left')}
              {header('state', 'State', 'left')}
              {COLUMNS.map((k) => header(k, MAJOR_METRICS[k].short, 'right', MAJOR_METRICS[k].tip))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-3 py-2 min-w-[14rem]">
                  <a href={schoolPath(r)} className="font-medium text-slate-900 hover:text-indigo-700">
                    {r.name}
                  </a>
                  <div className="text-xs text-slate-400">
                    {r.city} · {OWNERSHIP_LABELS[r.ownership] ?? 'n/a'}
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.state}</td>
                {COLUMNS.map((k) => (
                  <td key={k} className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">
                    {r[k] === null ? (
                      <span className="text-slate-300">n/a</span>
                    ) : (
                      MAJOR_METRICS[k].format(r[k] as number)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="px-3 py-6 text-center text-slate-400">
                  No colleges match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-slate-500">
        <span>
          Showing {visible.length.toLocaleString()} of {sorted.length.toLocaleString()}. Starts sorted by degrees awarded;
          select a column to sort.
        </span>
        {sorted.length > PAGE && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-indigo-700 hover:text-indigo-900 font-medium"
          >
            {showAll ? `Show first ${PAGE}` : `Show all ${sorted.length.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  );
}
