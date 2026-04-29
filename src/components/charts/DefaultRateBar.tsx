import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { School } from '../../api/scorecard';

interface Props {
  schools: School[];
  selected: School[];
}

const PALETTE = ['#6366f1', '#0ea5e9', '#059669', '#f59e0b', '#dc2626'];

export function DefaultRateBar({ schools, selected }: Props) {
  const mode: 'selected' | 'top' = selected.length > 0 ? 'selected' : 'top';

  const data = useMemo(() => {
    if (mode === 'selected') {
      return selected
        .map((s, i) => ({
          name: s.name,
          rate: s.defaultRate3yr === null ? null : s.defaultRate3yr * 100,
          color: PALETTE[i % PALETTE.length],
        }))
        .filter((r) => r.rate !== null);
    }
    return schools
      .filter((s) => s.defaultRate3yr !== null)
      .sort((a, b) => (b.defaultRate3yr! - a.defaultRate3yr!))
      .slice(0, 10)
      .map((s) => ({
        name: s.name.length > 28 ? s.name.slice(0, 25) + '…' : s.name,
        rate: s.defaultRate3yr! * 100,
        color: '#dc2626',
      }));
  }, [mode, schools, selected]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">3-year default rate</h3>
      <p className="text-xs text-slate-500 mb-3">
        {mode === 'selected'
          ? 'Share of borrowers who defaulted within 3 years of entering repayment, per selected school.'
          : 'Top 10 highest default rates in the current filter. Select schools to see just those.'}
      </p>
      {data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
          No default rate data.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
          >
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              width={140}
            />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(1)}%`, 'Default rate']}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />
            <Bar dataKey="rate" radius={[0, 3, 3, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
