import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { School } from '../../api/scorecard';

interface Props {
  schools: School[];
  selected: School[];
}

const PALETTE = ['#6366f1', '#0ea5e9', '#059669', '#f59e0b', '#dc2626'];

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function RepaymentCurve({ schools, selected }: Props) {
  const [cohort, setCohort] = useState<'completers' | 'noncompleters'>('completers');
  const mode: 'selected' | 'aggregate' = selected.length > 0 ? 'selected' : 'aggregate';

  const years = [1, 3, 5, 7] as const;

  const pick = (s: School, yr: number): number | null => {
    const r = s.repayment;
    if (cohort === 'completers') {
      return yr === 1 ? r.yr1Comp : yr === 3 ? r.yr3Comp : yr === 5 ? r.yr5Comp : r.yr7Comp;
    }
    return yr === 1 ? r.yr1Non : yr === 3 ? r.yr3Non : yr === 5 ? r.yr5Non : r.yr7Non;
  };

  const data = useMemo(() => {
    if (mode === 'selected') {
      return years.map((yr) => {
        const row: Record<string, string | number | null> = { year: `${yr}y` };
        for (const s of selected) {
          const v = pick(s, yr);
          row[s.name] = v === null ? null : v * 100;
        }
        return row;
      });
    }
    return years.map((yr) => {
      const vals = schools.map((s) => pick(s, yr)).filter((v): v is number => v !== null);
      const m = mean(vals);
      return { year: `${yr}y`, 'Avg across results': m === null ? null : m * 100 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, schools, selected, cohort]);

  const lines =
    mode === 'selected'
      ? selected.map((s, i) => ({ key: s.name, color: PALETTE[i % PALETTE.length] }))
      : [{ key: 'Avg across results', color: '#7c3aed' }];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-700">
          Share making progress on loans over time
        </h3>
        <div className="inline-flex rounded border border-slate-300 text-xs overflow-hidden">
          <button
            onClick={() => setCohort('completers')}
            className={`px-2 py-1 ${
              cohort === 'completers'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Completers
          </button>
          <button
            onClick={() => setCohort('noncompleters')}
            className={`px-2 py-1 ${
              cohort === 'noncompleters'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Non-completers
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        % of borrowers whose loan balance has <em>decreased</em> N years into repayment. Higher = better.
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" />
          <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(v) =>
              v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`
            }
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
