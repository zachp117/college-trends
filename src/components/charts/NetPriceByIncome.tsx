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
import { INCOME_BRACKETS } from '../../api/scorecard';
import { fmtMoney } from '../../util/format';

interface Props {
  schools: School[];
  selected: School[];
}

const PALETTE = ['#6D5EF0', '#2F6FEB', '#16A34A', '#F59E0B', '#E0483D'];

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function NetPriceByIncome({ schools, selected }: Props) {
  const mode: 'selected' | 'aggregate' = selected.length > 0 ? 'selected' : 'aggregate';

  const data = useMemo(() => {
    if (mode === 'selected') {
      return INCOME_BRACKETS.map((b) => {
        const row: Record<string, string | number | null> = { bracket: b.label };
        for (const s of selected) {
          row[s.name] = s.netPriceByIncome[b.key];
        }
        return row;
      });
    }
    return INCOME_BRACKETS.map((b) => {
      const publicVals: number[] = [];
      const privateVals: number[] = [];
      for (const s of schools) {
        const v = s.netPriceByIncome[b.key];
        if (v === null || v === undefined) continue;
        if (s.ownership === 1) publicVals.push(v);
        else privateVals.push(v);
      }
      return {
        bracket: b.label,
        Public: median(publicVals),
        Private: median(privateVals),
      };
    });
  }, [mode, schools, selected]);

  const bars =
    mode === 'selected'
      ? selected.map((s, i) => ({ key: s.name, color: PALETTE[i % PALETTE.length] }))
      : [
          { key: 'Public', color: '#2F6FEB' },
          { key: 'Private', color: '#16A34A' },
        ];

  const anyData = data.some((row) =>
    bars.some((b) => {
      const v = row[b.key];
      return v !== null && v !== undefined;
    }),
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">
        Net price by family income
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        {mode === 'selected'
          ? `Actual price paid after aid, per selected school, by family income bracket.`
          : `Median net price across current results, split by public vs. private. Select schools in the table for a per-school breakdown.`}
      </p>
      {!anyData ? (
        <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
          No net-price data for these schools.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis dataKey="bracket" stroke="#64748b" fontSize={12} />
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
