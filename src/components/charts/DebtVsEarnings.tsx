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
  ReferenceLine,
} from 'recharts';
import type { School } from '../../api/scorecard';
import { OWNERSHIP_LABELS } from '../../api/scorecard';
import { fmtMoney, fmtPct } from '../../util/format';

interface Props {
  schools: School[];
}

const COLORS: Record<number, string> = {
  1: '#2F6FEB',
  2: '#16A34A',
  3: '#E0483D',
};

export function DebtVsEarnings({ schools }: Props) {
  const byOwnership = new Map<
    number,
    { x: number; y: number; name: string; def: number | null; ratio: number }[]
  >();
  for (const s of schools) {
    if (s.medianDebt === null || s.medianEarnings10 === null) continue;
    const arr = byOwnership.get(s.ownership) ?? [];
    arr.push({
      x: s.medianDebt,
      y: s.medianEarnings10,
      name: s.name,
      def: s.defaultRate3yr,
      ratio: s.medianEarnings10 / s.medianDebt,
    });
    byOwnership.set(s.ownership, arr);
  }

  const hasData = Array.from(byOwnership.values()).some((a) => a.length > 0);
  const maxDebt = Math.max(
    1,
    ...Array.from(byOwnership.values()).flatMap((a) => a.map((p) => p.x)),
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Debt vs. earnings (10 yrs out)</h3>
      <p className="text-xs text-slate-500 mb-3">
        Each dot = a school. Points above the dashed line earn more per year than their typical grad's total debt.
      </p>
      {!hasData ? (
        <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
          No schools with both debt and earnings data.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="Median debt"
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
            <ZAxis range={[60, 60]} />
            <ReferenceLine
              stroke="#94a3b8"
              strokeDasharray="4 4"
              segment={[
                { x: 0, y: 0 },
                { x: maxDebt, y: maxDebt },
              ]}
              ifOverflow="extendDomain"
              label={{ value: 'earnings = debt', position: 'insideTopLeft', fontSize: 10, fill: '#94a3b8' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload as {
                  name: string;
                  x: number;
                  y: number;
                  def: number | null;
                  ratio: number;
                };
                return (
                  <div className="bg-white border border-slate-200 rounded p-2 text-xs shadow">
                    <div className="font-medium">{d.name}</div>
                    <div>Median debt: {fmtMoney(d.x)}</div>
                    <div>Earnings (10y): {fmtMoney(d.y)}</div>
                    <div>Earnings ÷ debt: {d.ratio.toFixed(2)}×</div>
                    <div>3-yr default: {fmtPct(d.def)}</div>
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
                fill={COLORS[own] ?? '#6D5EF0'}
                fillOpacity={0.7}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
