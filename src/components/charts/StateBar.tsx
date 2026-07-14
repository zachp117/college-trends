import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { School } from '../../api/scorecard';

interface Props {
  schools: School[];
}

export function StateBar({ schools }: Props) {
  const byState = new Map<string, number>();
  for (const s of schools) {
    byState.set(s.state, (byState.get(s.state) ?? 0) + 1);
  }
  const data = Array.from(byState.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Top states in results</h3>
      <p className="text-xs text-slate-500 mb-3">Counts schools matching current filters.</p>
      {data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
          No data.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis dataKey="state" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="count" fill="#2F6FEB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
