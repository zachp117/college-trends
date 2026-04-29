import { useMemo, useState } from 'react';
import type { School } from '../api/scorecard';
import { OWNERSHIP_LABELS } from '../api/scorecard';
import { fmtMoney, fmtPct, fmtNum } from '../util/format';

type SortKey =
  | 'name'
  | 'state'
  | 'size'
  | 'admissionRate'
  | 'avgCost'
  | 'medianEarnings10'
  | 'completionRate';

interface Props {
  schools: School[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onOpenDetail?: (id: number) => void;
}

export function ResultsTable({
  schools,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('size');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const arr = [...schools];
    arr.sort((a, b) => {
      const av = a[sortKey] as number | string | null;
      const bv = b[sortKey] as number | string | null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [schools, sortKey, sortDir]);

  const header = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => (
    <th
      onClick={() => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else {
          setSortKey(key);
          setSortDir('desc');
        }
      }}
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 cursor-pointer select-none hover:text-indigo-600 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {label} {sortKey === key && (sortDir === 'asc' ? '↑' : '↓')}
    </th>
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="max-h-[480px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 w-8"></th>
              {header('Name', 'name')}
              {header('State', 'state')}
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Type
              </th>
              {header('Size', 'size', 'right')}
              {header('Admit %', 'admissionRate', 'right')}
              {header('Avg cost', 'avgCost', 'right')}
              {header('Completion', 'completionRate', 'right')}
              {header('Earnings (10y)', 'medianEarnings10', 'right')}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  No schools match these filters.
                </td>
              </tr>
            )}
            {sorted.map((s) => {
              const checked = selectedIds.has(s.id);
              return (
                <tr
                  key={s.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 ${
                    checked ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSelect(s.id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {onOpenDetail ? (
                      <button
                        onClick={() => onOpenDetail(s.id)}
                        className="text-left text-slate-800 hover:text-indigo-700 hover:underline"
                      >
                        {s.name}
                      </button>
                    ) : (
                      <span className="text-slate-800">{s.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{s.state}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {OWNERSHIP_LABELS[s.ownership] ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(s.size)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtPct(s.admissionRate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(s.avgCost)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtPct(s.completionRate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(s.medianEarnings10)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
