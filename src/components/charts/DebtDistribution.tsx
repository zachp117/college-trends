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

const BUCKETS = [
  { label: '<$10k', lo: 0, hi: 10000 },
  { label: '$10–15k', lo: 10000, hi: 15000 },
  { label: '$15–20k', lo: 15000, hi: 20000 },
  { label: '$20–25k', lo: 20000, hi: 25000 },
  { label: '$25–30k', lo: 25000, hi: 30000 },
  { label: '$30–40k', lo: 30000, hi: 40000 },
  { label: '$40k+', lo: 40000, hi: Infinity },
];

export function DebtDistribution({ schools }: Props) {
  const data = BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  let withData = 0;
  for (const s of schools) {
    if (s.medianDebt === null) continue;
    withData++;
    const idx = BUCKETS.findIndex((b) => s.medianDebt! >= b.lo && s.medianDebt! < b.hi);
    if (idx >= 0) data[idx].count++;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">
        Median debt — distribution
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Median debt at graduation across {withData} schools in the current filter.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
          <Tooltip
            formatter={(v: number) => [v, 'Schools']}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
