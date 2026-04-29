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
import type { School } from '../api/scorecard';
import { fmtMoney, fmtPct } from '../util/format';
import { InfoTooltip } from '../components/InfoTooltip';

interface Props {
  schools: School[];
  selectedSchools: School[];
}

const RACE_GROUPS = [
  { key: 'completion4yrWhite', label: 'White', color: '#3b82f6' },
  { key: 'completion4yrBlack', label: 'Black', color: '#7c3aed' },
  { key: 'completion4yrHispanic', label: 'Hispanic', color: '#f59e0b' },
  { key: 'completion4yrAsian', label: 'Asian', color: '#10b981' },
  { key: 'completion4yrAian', label: 'AIAN', color: '#dc2626' },
  { key: 'completion4yrNhpi', label: 'NHPI', color: '#ec4899' },
  { key: 'completion4yrTwoMore', label: '2+ races', color: '#0ea5e9' },
  { key: 'completion4yrNonRes', label: 'Non-resident', color: '#64748b' },
] as const;


function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function shortLabel(name: string): string {
  return name.length > 22 ? name.slice(0, 20) + '…' : name;
}

export function OutcomesTab({ schools, selectedSchools }: Props) {
  // ----- Summary gap stats -----
  const summary = useMemo(() => {
    // Within-school race completion spread: max – min across all reported racial
    // groups at the same school. Captures variability without privileging one
    // pairing.
    const raceCompletionKeys: (keyof School)[] = [
      'completion4yrWhite',
      'completion4yrBlack',
      'completion4yrHispanic',
      'completion4yrAsian',
      'completion4yrAian',
      'completion4yrNhpi',
      'completion4yrTwoMore',
    ];
    const raceCompletionSpreads = schools
      .map((s) => {
        const vals = raceCompletionKeys
          .map((k) => s[k])
          .filter((v): v is number => typeof v === 'number');
        if (vals.length < 2) return null;
        return Math.max(...vals) - Math.min(...vals);
      })
      .filter((v): v is number => v !== null);
    const gapPellNoPell = schools
      .map((s) =>
        s.completion6yrPell !== null && s.completion6yrNoPell !== null
          ? s.completion6yrNoPell - s.completion6yrPell
          : null,
      )
      .filter((v): v is number => v !== null);
    const gapMaleFemaleEarn = schools
      .map((s) =>
        s.earnings10MedianMale !== null && s.earnings10MedianNonMale !== null
          ? s.earnings10MedianMale - s.earnings10MedianNonMale
          : null,
      )
      .filter((v): v is number => v !== null);
    const gapHighLowTercEarn = schools
      .map((s) =>
        s.earnings10MedianHighTerc !== null && s.earnings10MedianLowTerc !== null
          ? s.earnings10MedianHighTerc - s.earnings10MedianLowTerc
          : null,
      )
      .filter((v): v is number => v !== null);
    return {
      raceSpread: median(raceCompletionSpreads),
      raceSpreadN: raceCompletionSpreads.length,
      gapPellNoPell: median(gapPellNoPell),
      gapPellNoPellN: gapPellNoPell.length,
      gapMaleFemaleEarn: median(gapMaleFemaleEarn),
      gapMaleFemaleEarnN: gapMaleFemaleEarn.length,
      gapHighLowTercEarn: median(gapHighLowTercEarn),
      gapHighLowTercEarnN: gapHighLowTercEarn.length,
    };
  }, [schools]);

  const showingSelected = selectedSchools.length > 0;
  const schoolsToChart = showingSelected ? selectedSchools : [];

  // ----- Completion by race -----
  const raceData = useMemo(() => {
    if (showingSelected) {
      return schoolsToChart.map((s) => {
        const row: Record<string, string | number | null> = { name: shortLabel(s.name) };
        for (const g of RACE_GROUPS) {
          const v = s[g.key as keyof School] as number | null;
          row[g.label] = v === null ? null : v * 100;
        }
        return row;
      });
    }
    // Aggregate across filter
    const row: Record<string, string | number | null> = { name: 'Avg across filter' };
    for (const g of RACE_GROUPS) {
      const vals = schools
        .map((s) => s[g.key as keyof School])
        .filter((v): v is number => typeof v === 'number');
      row[g.label] = vals.length === 0 ? null : (vals.reduce((a, b) => a + b, 0) / vals.length) * 100;
    }
    return [row];
  }, [schools, schoolsToChart, showingSelected]);

  // ----- Completion by gender + Pell -----
  const genderPellData = useMemo(() => {
    const sourceRows = showingSelected ? schoolsToChart : schools;
    if (showingSelected) {
      return schoolsToChart.map((s) => ({
        name: shortLabel(s.name),
        Male: s.completion6yrMale === null ? null : s.completion6yrMale * 100,
        Female: s.completion6yrFemale === null ? null : s.completion6yrFemale * 100,
        'Pell recip.': s.completion6yrPell === null ? null : s.completion6yrPell * 100,
        'No Pell': s.completion6yrNoPell === null ? null : s.completion6yrNoPell * 100,
      }));
    }
    const meanOf = (key: keyof School) => {
      const vals = sourceRows
        .map((s) => s[key])
        .filter((v): v is number => typeof v === 'number');
      return vals.length === 0 ? null : (vals.reduce((a, b) => a + b, 0) / vals.length) * 100;
    };
    return [
      {
        name: 'Avg across filter',
        Male: meanOf('completion6yrMale'),
        Female: meanOf('completion6yrFemale'),
        'Pell recip.': meanOf('completion6yrPell'),
        'No Pell': meanOf('completion6yrNoPell'),
      },
    ];
  }, [schools, schoolsToChart, showingSelected]);

  // ----- Earnings by gender / dependency / income tercile -----
  const earningsGenderData = useMemo(() => {
    const sourceRows = showingSelected ? schoolsToChart : schools;
    if (showingSelected) {
      return schoolsToChart.map((s) => ({
        name: shortLabel(s.name),
        Male: s.earnings10MedianMale,
        Female: s.earnings10MedianNonMale,
      }));
    }
    const meanOf = (key: keyof School) => {
      const vals = sourceRows
        .map((s) => s[key])
        .filter((v): v is number => typeof v === 'number');
      return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    return [
      { name: 'Avg across filter', Male: meanOf('earnings10MedianMale'), Female: meanOf('earnings10MedianNonMale') },
    ];
  }, [schools, schoolsToChart, showingSelected]);

  const earningsTercData = useMemo(() => {
    const sourceRows = showingSelected ? schoolsToChart : schools;
    if (showingSelected) {
      return schoolsToChart.map((s) => ({
        name: shortLabel(s.name),
        'Low income': s.earnings10MedianLowTerc,
        'Mid income': s.earnings10MedianMidTerc,
        'High income': s.earnings10MedianHighTerc,
      }));
    }
    const meanOf = (key: keyof School) => {
      const vals = sourceRows
        .map((s) => s[key])
        .filter((v): v is number => typeof v === 'number');
      return vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    return [
      {
        name: 'Avg across filter',
        'Low income': meanOf('earnings10MedianLowTerc'),
        'Mid income': meanOf('earnings10MedianMidTerc'),
        'High income': meanOf('earnings10MedianHighTerc'),
      },
    ];
  }, [schools, schoolsToChart, showingSelected]);

  return (
    <div className="space-y-6">
      {/* Summary gap stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GapCard
          label="Completion spread by race"
          value={fmtPct(summary.raceSpread)}
          n={summary.raceSpreadN}
          higherIsConcerning
          tip="The gap between the highest- and lowest-completing racial group at the same school. Larger values mean outcomes vary more across groups within the institution."
        />
        <GapCard
          label="No-Pell – Pell completion gap"
          value={fmtPct(summary.gapPellNoPell)}
          n={summary.gapPellNoPellN}
          higherIsConcerning
        />
        <GapCard
          label="Male – Female earnings gap"
          value={summary.gapMaleFemaleEarn === null ? '—' : `+${fmtMoney(summary.gapMaleFemaleEarn)}`}
          n={summary.gapMaleFemaleEarnN}
          higherIsConcerning
        />
        <GapCard
          label="High – low income tercile gap"
          value={summary.gapHighLowTercEarn === null ? '—' : `+${fmtMoney(summary.gapHighLowTercEarn)}`}
          n={summary.gapHighLowTercEarnN}
          higherIsConcerning
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion by race */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            4-year completion rate by race
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {showingSelected
              ? 'Per selected school. Gaps within a school speak louder than absolute levels.'
              : 'Average across the current filter. Select schools to see per-school breakdowns.'}
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, raceData.length * 80)}
          >
            <BarChart
              data={raceData}
              margin={{ top: 10, right: 20, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                angle={raceData.length > 1 ? -15 : 0}
                textAnchor={raceData.length > 1 ? 'end' : 'middle'}
                height={raceData.length > 1 ? 60 : 30}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`)}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {RACE_GROUPS.map((g) => (
                <Bar key={g.key} dataKey={g.label} fill={g.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion by Pell + Gender */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            6-year completion: gender & Pell status
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Title-IV cohort, completed within 6 years.
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, genderPellData.length * 80)}
          >
            <BarChart
              data={genderPellData}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                angle={genderPellData.length > 1 ? -15 : 0}
                textAnchor={genderPellData.length > 1 ? 'end' : 'middle'}
                height={genderPellData.length > 1 ? 60 : 30}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`)}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Male" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Female" fill="#ec4899" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Pell recip." fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="No Pell" fill="#14b8a6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Earnings by gender */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            10-yr earnings by gender
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Median earnings 10 years after entry.
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, earningsGenderData.length * 70)}
          >
            <BarChart
              data={earningsGenderData}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                angle={earningsGenderData.length > 1 ? -15 : 0}
                textAnchor={earningsGenderData.length > 1 ? 'end' : 'middle'}
                height={earningsGenderData.length > 1 ? 60 : 30}
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
              <Bar dataKey="Male" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Female" fill="#ec4899" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Earnings by income tercile */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            10-yr earnings by family income tercile (at entry)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Did students from low-income families end up earning the same as students from wealthy ones?
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, earningsTercData.length * 80)}
          >
            <BarChart
              data={earningsTercData}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                angle={earningsTercData.length > 1 ? -15 : 0}
                textAnchor={earningsTercData.length > 1 ? 'end' : 'middle'}
                height={earningsTercData.length > 1 ? 60 : 30}
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
              <Bar dataKey="Low income" fill="#fb923c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Mid income" fill="#facc15" radius={[3, 3, 0, 0]} />
              <Bar dataKey="High income" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Outcomes table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">
            Completion gaps — top 50 by enrollment
          </h3>
        </div>
        <div className="max-h-[440px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {[
                  'School',
                  'Overall',
                  'White',
                  'Black',
                  'Hispanic',
                  'Asian',
                  'Pell',
                  'No Pell',
                  'Pell gap',
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
              {[...schools]
                .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
                .slice(0, 50)
                .map((s) => {
                  const gap =
                    s.completion6yrPell !== null && s.completion6yrNoPell !== null
                      ? s.completion6yrNoPell - s.completion6yrPell
                      : null;
                  return (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtPct(s.completionRate)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtPct(s.completion4yrWhite)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtPct(s.completion4yrBlack)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtPct(s.completion4yrHispanic)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtPct(s.completion4yrAsian)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtPct(s.completion6yrPell)}</td>
                      <td className="px-3 py-2 tabular-nums">{fmtPct(s.completion6yrNoPell)}</td>
                      <td
                        className={`px-3 py-2 tabular-nums ${
                          gap === null
                            ? ''
                            : gap > 0.05
                              ? 'text-rose-700'
                              : gap < -0.02
                                ? 'text-emerald-700'
                                : ''
                        }`}
                      >
                        {gap === null
                          ? '—'
                          : `${gap > 0 ? '+' : ''}${(gap * 100).toFixed(1)} pp`}
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

function GapCard({
  label,
  value,
  n,
  higherIsConcerning,
  tip,
}: {
  label: string;
  value: string;
  n: number;
  higherIsConcerning: boolean;
  tip?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
      <div className="text-xs text-slate-500 inline-flex items-center">
        {label}
        {tip && <InfoTooltip text={tip} />}
      </div>
      <div
        className={`text-xl font-semibold tabular-nums mt-1 ${
          higherIsConcerning ? 'text-rose-700' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5">
        median across {n.toLocaleString()} schools
      </div>
    </div>
  );
}

