import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ZAxis,
  Legend,
} from 'recharts';
import type { School } from '../../api/scorecard';
import { OWNERSHIP_LABELS } from '../../api/scorecard';
import { fmtMoney } from '../../util/format';

interface Props {
  schools: School[];
}

const COLORS: Record<number, string> = {
  1: '#2563eb',
  2: '#059669',
  3: '#dc2626',
};

export function CostEarningsScatter({ schools }: Props) {
  const byOwnership = new Map<number, { x: number; y: number; name: string; size: number }[]>();
  for (const s of schools) {
    if (s.avgCost === null || s.medianEarnings10 === null) continue;
    const arr = byOwnership.get(s.ownership) ?? [];
    arr.push({
      x: s.avgCost,
      y: s.medianEarnings10,
      name: s.name,
      size: s.size ?? 1000,
    });
    byOwnership.set(s.ownership, arr);
  }

  const hasData = Array.from(byOwnership.values()).some((a) => a.length > 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">
        Avg net cost vs. median earnings (10 yrs out)
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Bubble size = student body. Each point is a school.
      </p>
      {!hasData ? (
        <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
          No schools with both cost and earnings data.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="Avg cost"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Median earnings"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              stroke="#64748b"
              fontSize={12}
            />
            <ZAxis type="number" dataKey="size" range={[40, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload as {
                  name: string;
                  x: number;
                  y: number;
                  size: number;
                };
                return (
                  <div className="bg-white border border-slate-200 rounded p-2 text-xs shadow">
                    <div className="font-medium">{d.name}</div>
                    <div>Cost: {fmtMoney(d.x)}</div>
                    <div>Earnings: {fmtMoney(d.y)}</div>
                    <div>Students: {d.size.toLocaleString()}</div>
                  </div>
                );
              }}
            />
            <Legend />
            {Array.from(byOwnership.entries()).map(([own, data]) => (
              <Scatter
                key={own}
                name={OWNERSHIP_LABELS[own] ?? `Type ${own}`}
                data={data}
                fill={COLORS[own] ?? '#6366f1'}
                fillOpacity={0.7}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
