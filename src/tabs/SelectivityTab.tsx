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
  Cell,
} from 'recharts';
import type { School } from '../api/scorecard';
import { OWNERSHIP_LABELS, TEST_POLICY_LABELS } from '../api/scorecard';
import { fmtNum, fmtPct } from '../util/format';
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

const SELECTIVITY_TIERS = [
  { label: '<10%', lo: 0, hi: 0.1, color: '#7c3aed' },
  { label: '10–25%', lo: 0.1, hi: 0.25, color: '#6366f1' },
  { label: '25–50%', lo: 0.25, hi: 0.5, color: '#0ea5e9' },
  { label: '50–75%', lo: 0.5, hi: 0.75, color: '#10b981' },
  { label: '75%+', lo: 0.75, hi: 1.01, color: '#94a3b8' },
];

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function shortLabel(name: string): string {
  return name.length > 22 ? name.slice(0, 20) + '…' : name;
}

function satTotal(s: School, percentile: 25 | 50 | 75): number | null {
  const r = s[`satRead${percentile}` as keyof School] as number | null;
  const m = s[`satMath${percentile}` as keyof School] as number | null;
  if (r === null || m === null) return null;
  return r + m;
}

export function SelectivityTab({ schools, selectedSchools }: Props) {
  // Summary stats
  const summary = useMemo(() => {
    const admit = schools.map((s) => s.admissionRate).filter((v): v is number => v !== null);
    const sat50 = schools
      .map((s) => satTotal(s, 50))
      .filter((v): v is number => v !== null);
    const act50 = schools.map((s) => s.actCum50).filter((v): v is number => v !== null);
    const optional = schools.filter((s) => s.testRequirements === 5).length;
    const reportingPolicy = schools.filter((s) => s.testRequirements !== null).length;
    const ultraSelective = schools.filter(
      (s) => s.admissionRate !== null && s.admissionRate < 0.25,
    ).length;
    return {
      medAdmit: median(admit),
      nAdmit: admit.length,
      medSat50: median(sat50),
      nSat: sat50.length,
      medAct50: median(act50),
      nAct: act50.length,
      optionalShare:
        reportingPolicy === 0 ? null : optional / reportingPolicy,
      nReportingPolicy: reportingPolicy,
      ultraSelective,
    };
  }, [schools]);

  // Selectivity tier histogram
  const tierBuckets = useMemo(() => {
    const buckets = SELECTIVITY_TIERS.map((t) => ({
      label: t.label,
      color: t.color,
      count: 0,
    }));
    for (const s of schools) {
      if (s.admissionRate === null) continue;
      const idx = SELECTIVITY_TIERS.findIndex(
        (t) => s.admissionRate! >= t.lo && s.admissionRate! < t.hi,
      );
      if (idx >= 0) buckets[idx].count++;
    }
    return buckets;
  }, [schools]);

  // Test policy distribution
  const testPolicyData = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const s of schools) {
      if (s.testRequirements === null) continue;
      counts[s.testRequirements] = (counts[s.testRequirements] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([k, count]) => ({
        label: TEST_POLICY_LABELS[Number(k)] ?? `Code ${k}`,
        count,
        code: Number(k),
      }))
      .sort((a, b) => b.count - a.count);
  }, [schools]);

  // SAT range chart for selected schools
  const satRangeData = useMemo(() => {
    const target = selectedSchools.length > 0 ? selectedSchools : [];
    return target.map((s) => {
      const p25 = satTotal(s, 25);
      const p50 = satTotal(s, 50);
      const p75 = satTotal(s, 75);
      // Stacked bar: base = 25, low fill = (50-25), high fill = (75-50)
      return {
        name: shortLabel(s.name),
        fullName: s.name,
        p25,
        p50,
        p75,
        // For stacked rendering:
        base: p25 ?? 0,
        lowToMid: p25 !== null && p50 !== null ? p50 - p25 : 0,
        midToHigh: p50 !== null && p75 !== null ? p75 - p50 : 0,
        hasData: p25 !== null && p75 !== null,
      };
    });
  }, [selectedSchools]);

  const satRangeMin = useMemo(() => {
    const vals = satRangeData
      .filter((d) => d.hasData)
      .map((d) => d.p25)
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    return Math.max(0, Math.min(...vals) - 100);
  }, [satRangeData]);

  // ACT range chart for selected schools
  const actRangeData = useMemo(() => {
    const target = selectedSchools.length > 0 ? selectedSchools : [];
    return target.map((s) => ({
      name: shortLabel(s.name),
      fullName: s.name,
      p25: s.actCum25,
      p50: s.actCum50,
      p75: s.actCum75,
      base: s.actCum25 ?? 0,
      lowToMid:
        s.actCum25 !== null && s.actCum50 !== null ? s.actCum50 - s.actCum25 : 0,
      midToHigh:
        s.actCum50 !== null && s.actCum75 !== null ? s.actCum75 - s.actCum50 : 0,
      hasData: s.actCum25 !== null && s.actCum75 !== null,
    }));
  }, [selectedSchools]);

  const actRangeMin = useMemo(() => {
    const vals = actRangeData
      .filter((d) => d.hasData)
      .map((d) => d.p25)
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    return Math.max(0, Math.min(...vals) - 2);
  }, [actRangeData]);

  // Admit rate vs SAT scatter
  const scatterData = useMemo(() => {
    return schools
      .map((s) => {
        const sat = satTotal(s, 50);
        if (s.admissionRate === null || sat === null) return null;
        return {
          x: s.admissionRate * 100,
          y: sat,
          name: s.name,
          size: s.size ?? 1000,
          ownership: s.ownership,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [schools]);

  const scatterByOwnership = useMemo(() => {
    const map = new Map<number, typeof scatterData>();
    for (const d of scatterData) {
      const arr = map.get(d.ownership) ?? [];
      arr.push(d);
      map.set(d.ownership, arr);
    }
    return map;
  }, [scatterData]);

  // Top 50 selective schools by admit rate
  const topSelective = useMemo(() => {
    return [...schools]
      .filter((s) => s.admissionRate !== null)
      .sort((a, b) => a.admissionRate! - b.admissionRate!)
      .slice(0, 50);
  }, [schools]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Typical admit rate"
          tip="admit-rate"
          value={fmtPct(summary.medAdmit)}
          sub={`${summary.nAdmit.toLocaleString()} schools reporting`}
        />
        <StatCard
          label="Typical SAT score"
          tip="sat-percentile"
          value={summary.medSat50 === null ? '—' : Math.round(summary.medSat50).toString()}
          sub={`Reading + Math · ${summary.nSat.toLocaleString()} schools`}
        />
        <StatCard
          label="Typical ACT score"
          value={summary.medAct50 === null ? '—' : summary.medAct50.toFixed(1)}
          sub={`composite · ${summary.nAct.toLocaleString()} schools`}
        />
        <StatCard
          label="% test-optional"
          tip="test-optional"
          value={fmtPct(summary.optionalShare)}
          sub={`of ${summary.nReportingPolicy.toLocaleString()} reporting policy`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selectivity tiers */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Schools by selectivity tier
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            <span className="font-medium">{summary.ultraSelective.toLocaleString()}</span> schools
            in the filter admit fewer than 25% of applicants.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tierBuckets} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, 'Schools']}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {tierBuckets.map((b, i) => (
                  <Cell key={i} fill={b.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Test policy distribution */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Test-score policy</h3>
          <p className="text-xs text-slate-500 mb-3">
            Schools' stated stance on standardized tests in admissions.
          </p>
          {testPolicyData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
              No schools report a test policy.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={testPolicyData}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
              >
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  width={200}
                />
                <Tooltip
                  formatter={(v: number) => [v, 'Schools']}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* SAT range for selected */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            SAT score range — selected schools
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            25th, 50th, and 75th percentiles for total SAT (Reading + Math). Bar spans 25th to
            75th; tick marks the 50th.
          </p>
          {satRangeData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              Select schools in the table below to see their SAT score ranges.
            </div>
          ) : satRangeData.every((d) => !d.hasData) ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              None of the selected schools report SAT distribution data.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(160, satRangeData.length * 50)}
            >
              <SatActRangeChart data={satRangeData} domainMin={satRangeMin} domainMax={1600} />
            </ResponsiveContainer>
          )}
        </div>

        {/* ACT range for selected */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            ACT score range — selected schools
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            25th, 50th, and 75th percentiles for ACT cumulative.
          </p>
          {actRangeData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              Select schools in the table below to see their ACT score ranges.
            </div>
          ) : actRangeData.every((d) => !d.hasData) ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              None of the selected schools report ACT distribution data.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(160, actRangeData.length * 50)}
            >
              <SatActRangeChart data={actRangeData} domainMin={actRangeMin} domainMax={36} />
            </ResponsiveContainer>
          )}
        </div>

        {/* Admit rate vs SAT scatter */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Admit rate vs. SAT (50th percentile total)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Each dot = a school. Bubble size = enrollment, color = ownership type.
          </p>
          {scatterData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              No schools with both admit rate and SAT data in the current filter.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Admit %"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="SAT 50th (R+M)"
                  domain={[800, 1600]}
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
                        <div>Admit rate: {d.x.toFixed(1)}%</div>
                        <div>SAT 50th: {d.y}</div>
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
                    fillOpacity={0.65}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top 50 most selective table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">
            Most selective in the filter — top 50 by admit rate
          </h3>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {[
                  'School',
                  'Admit %',
                  'SAT 25',
                  'SAT 50',
                  'SAT 75',
                  'ACT 25',
                  'ACT 50',
                  'ACT 75',
                  'Test policy',
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
              {topSelective.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtPct(s.admissionRate)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(satTotal(s, 25))}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(satTotal(s, 50))}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(satTotal(s, 75))}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(s.actCum25)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(s.actCum50)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(s.actCum75)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {s.testRequirements === null
                      ? '—'
                      : TEST_POLICY_LABELS[s.testRequirements] ?? `Code ${s.testRequirements}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface SatActRangeChartProps {
  data: Array<{
    name: string;
    fullName: string;
    p25: number | null;
    p50: number | null;
    p75: number | null;
    base: number;
    lowToMid: number;
    midToHigh: number;
    hasData: boolean;
  }>;
  domainMin: number;
  domainMax: number;
  width?: number;
  height?: number;
}

function SatActRangeChart({
  data,
  domainMin,
  domainMax,
  width,
  height,
}: SatActRangeChartProps) {
  return (
    <BarChart
      width={width}
      height={height}
      data={data}
      layout="vertical"
      margin={{ top: 10, right: 30, bottom: 10, left: 10 }}
      barCategoryGap="35%"
    >
      <CartesianGrid stroke="#e2e8f0" />
      <XAxis type="number" domain={[domainMin, domainMax]} stroke="#64748b" fontSize={12} />
      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={150} />
      <Tooltip
        content={({ active, payload }) => {
          if (!active || !payload || payload.length === 0) return null;
          const d = payload[0].payload as {
            fullName: string;
            p25: number | null;
            p50: number | null;
            p75: number | null;
          };
          return (
            <div className="bg-white border border-slate-200 rounded p-2 text-xs shadow">
              <div className="font-medium">{d.fullName}</div>
              <div>25th: {d.p25 ?? '—'}</div>
              <div>50th: {d.p50 ?? '—'}</div>
              <div>75th: {d.p75 ?? '—'}</div>
            </div>
          );
        }}
      />
      <Bar dataKey="base" stackId="rng" fill="transparent" />
      <Bar dataKey="lowToMid" stackId="rng" fill="#a5b4fc" />
      <Bar dataKey="midToHigh" stackId="rng" fill="#6366f1" />
    </BarChart>
  );
}


