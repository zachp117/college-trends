import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { School } from '../../api/scorecard';
import { fmtMoney } from '../../util/format';

interface Props {
  schools: School[];
  selected: School[];
}

const PALETTE = ['#6D5EF0', '#2F6FEB', '#16A34A', '#F59E0B', '#E0483D'];

const GROUPS = [
  { key: 'completers', label: 'Completers', get: (s: School) => s.medianDebt },
  { key: 'noncompleters', label: 'Non-completers', get: (s: School) => s.medianDebtNoncompleters },
  { key: 'pell', label: 'Pell', get: (s: School) => s.medianDebtPell },
  { key: 'noPell', label: 'No Pell', get: (s: School) => s.medianDebtNoPell },
  { key: 'lowInc', label: 'Low income', get: (s: School) => s.medianDebtLowIncome },
  { key: 'midInc', label: 'Mid income', get: (s: School) => s.medianDebtMidIncome },
  { key: 'highInc', label: 'High income', get: (s: School) => s.medianDebtHighIncome },
  { key: 'female', label: 'Female', get: (s: School) => s.medianDebtFemale },
  { key: 'male', label: 'Male', get: (s: School) => s.medianDebtMale },
];

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function DebtByGroup({ schools, selected }: Props) {
  const mode: 'selected' | 'aggregate' = selected.length > 0 ? 'selected' : 'aggregate';

  const data = useMemo(() => {
    if (mode === 'selected') {
      return GROUPS.map((g) => {
        const row: Record<string, string | number | null> = { group: g.label };
        for (const s of selected) {
          row[s.name] = g.get(s);
        }
        return row;
      });
    }
    return GROUPS.map((g) => {
      const vals = schools.map((s) => g.get(s)).filter((v): v is number => v !== null);
      return { group: g.label, 'Avg across results': mean(vals) };
    });
  }, [mode, schools, selected]);

  const bars =
    mode === 'selected'
      ? selected.map((s, i) => ({ key: s.name, color: PALETTE[i % PALETTE.length] }))
      : [{ key: 'Avg across results', color: '#6D5EF0' }];

  const anyData = data.some((row) =>
    bars.some((b) => {
      const v = row[b.key];
      return v !== null && v !== undefined;
    }),
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Median debt by student group</h3>
      <p className="text-xs text-slate-500 mb-3">
        {mode === 'selected'
          ? 'Debt load by sub-population, for each selected school.'
          : 'Average across current results. Pin schools (📌) to compare per-school.'}
      </p>
      {!anyData ? (
        <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
          No data.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis dataKey="group" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v) => (v === null || v === undefined ? '—' : fmtMoney(Number(v)))}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {bars.map((b) => (
              <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
