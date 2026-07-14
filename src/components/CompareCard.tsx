import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import type { School } from '../api/scorecard';
import { fmtMoney, fmtPct, fmtNum } from '../util/format';

interface Props {
  schools: School[];
  onClear: () => void;
  onRemove: (id: number) => void;
}

const PALETTE = ['#6D5EF0', '#2F6FEB', '#16A34A', '#F59E0B', '#E0483D'];

function normalize(vals: (number | null)[]): (number | null)[] {
  const nums = vals.filter((v): v is number => v !== null);
  if (nums.length === 0) return vals.map(() => null);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  return vals.map((v) => (v === null ? null : ((v - min) / range) * 100));
}

function normalizeInverted(vals: (number | null)[]): (number | null)[] {
  return normalize(vals).map((v) => (v === null ? null : 100 - v));
}

export function CompareCard({ schools, onClear, onRemove }: Props) {
  if (schools.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-center text-slate-500 text-sm">
        Pin schools (📌) from the table or the school detail page to compare them here.
      </div>
    );
  }

  const metrics = [
    { key: 'completionRate', label: 'Completion', invert: false },
    { key: 'medianEarnings10', label: 'Earnings', invert: false },
    { key: 'avgCost', label: 'Affordability', invert: true },
    { key: 'admissionRate', label: 'Selectivity', invert: true },
    { key: 'size', label: 'Size', invert: false },
  ] as const;

  const normalized: Record<string, (number | null)[]> = {};
  for (const m of metrics) {
    const vals = schools.map((s) => s[m.key] as number | null);
    normalized[m.key] = m.invert ? normalizeInverted(vals) : normalize(vals);
  }

  const radarData = metrics.map((m) => {
    const row: Record<string, string | number | null> = { metric: m.label };
    schools.forEach((s, i) => {
      row[s.name] = normalized[m.key][i];
    });
    return row;
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Compare schools</h3>
          <p className="text-xs text-slate-500">
            Radar shows each metric normalized 0–100 within the selected set. Cost & selectivity inverted (higher = better for student).
          </p>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-800 underline"
        >
          Clear all
        </button>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={radarData} outerRadius="75%">
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#475569' }} />
          <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
          <Tooltip
            formatter={(v: number) => (v === null ? '—' : v.toFixed(0))}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {schools.map((s, i) => (
            <Radar
              key={s.id}
              name={s.name}
              dataKey={s.name}
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.15}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1 pr-4">Metric</th>
              {schools.map((s) => (
                <th key={s.id} className="py-1 pr-4">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">{s.name}</span>
                    <button
                      onClick={() => onRemove(s.id)}
                      className="text-slate-400 hover:text-red-500"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            <Row label="Size" schools={schools} fn={(s) => fmtNum(s.size)} />
            <Row label="Admit rate" schools={schools} fn={(s) => fmtPct(s.admissionRate)} />
            <Row label="Avg net cost" schools={schools} fn={(s) => fmtMoney(s.avgCost)} />
            <Row label="Completion" schools={schools} fn={(s) => fmtPct(s.completionRate)} />
            <Row label="Median debt" schools={schools} fn={(s) => fmtMoney(s.medianDebt)} />
            <Row
              label="Earnings (10y)"
              schools={schools}
              fn={(s) => fmtMoney(s.medianEarnings10)}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  label,
  schools,
  fn,
}: {
  label: string;
  schools: School[];
  fn: (s: School) => string;
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-1 pr-4 text-slate-500">{label}</td>
      {schools.map((s) => (
        <td key={s.id} className="py-1 pr-4 text-slate-800">
          {fn(s)}
        </td>
      ))}
    </tr>
  );
}
