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

export function AdmissionHistogram({ schools }: Props) {
  const buckets = [
    { label: '0–10%', lo: 0, hi: 0.1, count: 0 },
    { label: '10–25%', lo: 0.1, hi: 0.25, count: 0 },
    { label: '25–50%', lo: 0.25, hi: 0.5, count: 0 },
    { label: '50–75%', lo: 0.5, hi: 0.75, count: 0 },
    { label: '75–100%', lo: 0.75, hi: 1.01, count: 0 },
  ];

  let withData = 0;
  for (const s of schools) {
    if (s.admissionRate === null) continue;
    withData++;
    const b = buckets.find((x) => s.admissionRate! >= x.lo && s.admissionRate! < x.hi);
    if (b) b.count++;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Admission rate distribution</h3>
      <p className="text-xs text-slate-500 mb-3">
        {withData} of {schools.length} schools have admission rate data.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={buckets} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
          <Tooltip
            formatter={(v: number) => [v, 'Schools']}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
