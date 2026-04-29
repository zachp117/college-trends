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
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { School } from '../api/scorecard';
import { OWNERSHIP_LABELS } from '../api/scorecard';
import { fmtMoney, fmtPct } from '../util/format';
import { StatCard } from '../components/StatCard';

interface Props {
  schools: School[];
  selectedSchools: School[];
}

const OWNERSHIP_COLOR: Record<number, string> = {
  1: '#2563eb',
  2: '#059669',
  3: '#dc2626',
};

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function shortLabel(name: string): string {
  return name.length > 22 ? name.slice(0, 20) + '…' : name;
}

export function LoanAidTab({ schools, selectedSchools }: Props) {
  // ---------- Summary cards ----------
  const summary = useMemo(() => {
    const ftFedLoan = schools
      .map((s) => s.ftftFederalLoanRate)
      .filter((v): v is number => v !== null);
    const ftPell = schools
      .map((s) => s.ftftPellGrantRate)
      .filter((v): v is number => v !== null);
    const studentDebt = schools
      .map((s) => s.medianDebt)
      .filter((v): v is number => v !== null);
    const plusAll = schools
      .map((s) => s.plusDebtAll)
      .filter((v): v is number => v !== null);
    return {
      medFtFedLoan: median(ftFedLoan),
      nFtFedLoan: ftFedLoan.length,
      medFtPell: median(ftPell),
      nFtPell: ftPell.length,
      medStudentDebt: median(studentDebt),
      nStudentDebt: studentDebt.length,
      medPlus: median(plusAll),
      nPlus: plusAll.length,
    };
  }, [schools]);

  // ---------- Federal-loan-rate distribution ----------
  const loanRateHist = useMemo(() => {
    const buckets = [
      { label: '<10%', lo: 0, hi: 0.1 },
      { label: '10–25%', lo: 0.1, hi: 0.25 },
      { label: '25–50%', lo: 0.25, hi: 0.5 },
      { label: '50–75%', lo: 0.5, hi: 0.75 },
      { label: '75%+', lo: 0.75, hi: 1.01 },
    ].map((b) => ({ ...b, count: 0 }));
    let n = 0;
    for (const s of schools) {
      const r = s.federalLoanRate;
      if (r === null) continue;
      n++;
      const b = buckets.find((x) => r >= x.lo && r < x.hi);
      if (b) b.count++;
    }
    return { buckets, n };
  }, [schools]);

  // ---------- Student debt vs Parent PLUS scatter ----------
  const plusScatter = useMemo(() => {
    return schools
      .map((s) => {
        if (s.medianDebt === null || s.plusDebtAll === null) return null;
        return {
          x: s.medianDebt,
          y: s.plusDebtAll,
          name: s.name,
          size: s.size ?? 1000,
          ownership: s.ownership,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [schools]);

  const scatterByOwnership = useMemo(() => {
    const map = new Map<number, typeof plusScatter>();
    for (const d of plusScatter) {
      const arr = map.get(d.ownership) ?? [];
      arr.push(d);
      map.set(d.ownership, arr);
    }
    return map;
  }, [plusScatter]);

  // ---------- Debt by income bracket (selected) ----------
  const incomeData = useMemo(() => {
    if (selectedSchools.length === 0) {
      // Aggregate
      const meanOf = (key: keyof School) => {
        const vals = schools
          .map((s) => s[key])
          .filter((v): v is number => typeof v === 'number');
        return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
      };
      return [
        {
          name: 'Avg across filter',
          '<$30k': meanOf('medianDebtLowIncome'),
          '$30–75k': meanOf('medianDebtMidIncome'),
          '>$75k': meanOf('medianDebtHighIncome'),
        },
      ];
    }
    return selectedSchools.map((s) => ({
      name: shortLabel(s.name),
      fullName: s.name,
      '<$30k': s.medianDebtLowIncome,
      '$30–75k': s.medianDebtMidIncome,
      '>$75k': s.medianDebtHighIncome,
    }));
  }, [schools, selectedSchools]);

  // ---------- Debt by demo (selected) — first-gen / dependency ----------
  const demoData = useMemo(() => {
    if (selectedSchools.length === 0) {
      const meanOf = (key: keyof School) => {
        const vals = schools
          .map((s) => s[key])
          .filter((v): v is number => typeof v === 'number');
        return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
      };
      return [
        {
          name: 'Avg across filter',
          'First-gen': meanOf('medianDebtFirstGen'),
          'Not first-gen': meanOf('medianDebtNotFirstGen'),
          Dependent: meanOf('medianDebtDependent'),
          Independent: meanOf('medianDebtIndependent'),
        },
      ];
    }
    return selectedSchools.map((s) => ({
      name: shortLabel(s.name),
      fullName: s.name,
      'First-gen': s.medianDebtFirstGen,
      'Not first-gen': s.medianDebtNotFirstGen,
      Dependent: s.medianDebtDependent,
      Independent: s.medianDebtIndependent,
    }));
  }, [schools, selectedSchools]);

  // ---------- Parent PLUS by completion status (selected) ----------
  const plusData = useMemo(() => {
    if (selectedSchools.length === 0) {
      const meanOf = (key: keyof School) => {
        const vals = schools
          .map((s) => s[key])
          .filter((v): v is number => typeof v === 'number');
        return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
      };
      return [
        {
          name: 'Avg across filter',
          'PLUS, completers': meanOf('plusDebtCompleters'),
          'PLUS, non-completers': meanOf('plusDebtNoncompleters'),
        },
      ];
    }
    return selectedSchools.map((s) => ({
      name: shortLabel(s.name),
      fullName: s.name,
      'PLUS, completers': s.plusDebtCompleters,
      'PLUS, non-completers': s.plusDebtNoncompleters,
    }));
  }, [schools, selectedSchools]);

  // ---------- Top by Parent PLUS debt ----------
  const topByPlus = useMemo(() => {
    return [...schools]
      .filter((s) => s.plusDebtAll !== null)
      .sort((a, b) => b.plusDebtAll! - a.plusDebtAll!)
      .slice(0, 25);
  }, [schools]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="% taking federal loans"
          tip="ftft"
          value={fmtPct(summary.medFtFedLoan)}
          sub={`first-year, full-time · ${summary.nFtFedLoan.toLocaleString()} schools`}
        />
        <StatCard
          label="% on Pell grants"
          tip="pell"
          value={fmtPct(summary.medFtPell)}
          sub={`first-year, full-time · ${summary.nFtPell.toLocaleString()} schools`}
        />
        <StatCard
          label="Typical student loan balance"
          tip="student-debt"
          value={fmtMoney(summary.medStudentDebt)}
          sub={`at graduation · ${summary.nStudentDebt.toLocaleString()} schools`}
        />
        <StatCard
          label="Typical Parent PLUS balance"
          tip="parent-plus"
          value={fmtMoney(summary.medPlus)}
          sub={`among parents who borrowed · ${summary.nPlus.toLocaleString()} schools`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Federal loan rate distribution */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Share of students borrowing federal loans
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {loanRateHist.n.toLocaleString()} schools reporting. Higher = more students take federal loans to attend.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={loanRateHist.buckets}
              margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, 'Schools']}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {loanRateHist.buckets.map((_b, i) => (
                  <Cell
                    key={i}
                    fill={`rgb(${Math.round(165 + i * 20)},${Math.round(180 - i * 30)},${Math.round(252 - i * 30)})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Student debt vs Parent PLUS scatter */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Student debt vs. Parent PLUS debt
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Each dot = a school. Dashed line = parity. Dots above the line have parents borrowing more than students.
          </p>
          {plusScatter.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              No schools report both student and PLUS debt.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Student debt"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="PLUS debt"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <ZAxis type="number" dataKey="size" range={[40, 400]} />
                <ReferenceLine
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  segment={[
                    { x: 0, y: 0 },
                    { x: 100000, y: 100000 },
                  ]}
                  ifOverflow="extendDomain"
                />
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
                        <div>Student debt: {fmtMoney(d.x)}</div>
                        <div>PLUS debt: {fmtMoney(d.y)}</div>
                        <div>Ratio: {(d.y / d.x).toFixed(2)}×</div>
                        <div>Size: {d.size.toLocaleString()}</div>
                      </div>
                    );
                  }}
                />
                <Legend />
                {Array.from(scatterByOwnership.entries()).map(([own, data]) => (
                  <Scatter
                    key={own}
                    name={OWNERSHIP_LABELS[own] ?? `Type ${own}`}
                    data={data}
                    fill={OWNERSHIP_COLOR[own] ?? '#6366f1'}
                    fillOpacity={0.6}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Debt by income bracket */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Median debt by family income
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {selectedSchools.length > 0
              ? 'Debt brackets per selected school.'
              : 'Aggregate across the filter.'}
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, incomeData.length * 60)}
          >
            <BarChart
              data={incomeData}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                angle={incomeData.length > 1 ? -15 : 0}
                textAnchor={incomeData.length > 1 ? 'end' : 'middle'}
                height={incomeData.length > 1 ? 60 : 30}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : fmtMoney(Number(v)))}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="<$30k" fill="#fb923c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="$30–75k" fill="#facc15" radius={[3, 3, 0, 0]} />
              <Bar dataKey=">$75k" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Debt by first-gen + dependency */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Median debt: first-gen & dependency
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {selectedSchools.length > 0
              ? 'Debt by sub-population per selected school.'
              : 'Aggregate across the filter.'}
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, demoData.length * 60)}
          >
            <BarChart
              data={demoData}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                angle={demoData.length > 1 ? -15 : 0}
                textAnchor={demoData.length > 1 ? 'end' : 'middle'}
                height={demoData.length > 1 ? 60 : 30}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : fmtMoney(Number(v)))}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="First-gen" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Not first-gen" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Dependent" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Independent" fill="#14b8a6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Parent PLUS by completion */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Parent PLUS debt: completers vs. non-completers
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Median Parent PLUS balance by whether the student finished the program. Often a sharper inequality than student debt.
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, plusData.length * 60)}
          >
            <BarChart data={plusData} margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                angle={plusData.length > 1 ? -15 : 0}
                textAnchor={plusData.length > 1 ? 'end' : 'middle'}
                height={plusData.length > 1 ? 60 : 30}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : fmtMoney(Number(v)))}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="PLUS, completers" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              <Bar dataKey="PLUS, non-completers" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top by Parent PLUS table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">
            Top 25 by Parent PLUS debt
          </h3>
        </div>
        <div className="max-h-[440px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {[
                  'School',
                  'PLUS (all)',
                  'PLUS (completers)',
                  'Monthly pmt',
                  'PLUS (non-comp.)',
                  'Student debt',
                  'PLUS / student',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topByPlus.map((s) => {
                const ratio =
                  s.plusDebtAll !== null && s.medianDebt !== null && s.medianDebt > 0
                    ? s.plusDebtAll / s.medianDebt
                    : null;
                return (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(s.plusDebtAll)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(s.plusDebtCompleters)}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {s.plusDebtCompletersPayment === null
                        ? '—'
                        : fmtMoney(Math.round(s.plusDebtCompletersPayment))}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(s.plusDebtNoncompleters)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(s.medianDebt)}</td>
                    <td
                      className={`px-3 py-2 tabular-nums ${
                        ratio === null ? '' : ratio > 1.5 ? 'text-rose-700' : ratio > 1 ? 'text-amber-700' : ''
                      }`}
                    >
                      {ratio === null ? '—' : `${ratio.toFixed(2)}×`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

