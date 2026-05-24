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
import { fmtPct } from '../util/format';
import { StatCard } from '../components/StatCard';
import { Accordion, AccordionSection } from '../components/Accordion';

interface Props {
  schools: School[];
  selectedSchools: School[];
}

const OWNERSHIP_COLOR: Record<number, string> = {
  1: '#2563eb',
  2: '#059669',
  3: '#dc2626',
};

const COHORT_BUCKETS = [
  { key: 'completed', label: 'Completed here', color: '#059669' },
  { key: 'transfCompleted', label: 'Transferred + completed', color: '#a7f3d0' },
  { key: 'stillEnrolled', label: 'Still enrolled', color: '#facc15' },
  { key: 'withdrawn', label: 'Withdrew', color: '#dc2626' },
  { key: 'transfWithdrawn', label: 'Transferred + withdrew', color: '#fca5a5' },
  { key: 'unknown', label: 'Unknown', color: '#cbd5e1' },
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

function bestRetention(s: School): number | null {
  return s.retentionFt4yr ?? s.retentionFtLt4yr ?? null;
}

export function RetentionTab({ schools, selectedSchools }: Props) {
  // ----- Summary cards -----
  const summary = useMemo(() => {
    const ret = schools
      .map((s) => bestRetention(s))
      .filter((v): v is number => v !== null);
    const completed6 = schools
      .map((s) => s.titleIvCompleted6)
      .filter((v): v is number => v !== null);
    const withdrawn6 = schools
      .map((s) => s.titleIvWithdrawn6)
      .filter((v): v is number => v !== null);
    const transferred = schools
      .map((s) => {
        const a = s.titleIvTransfCompleted6 ?? 0;
        const b = s.titleIvTransfCompleted2yr6 ?? 0;
        const c = s.titleIvTransfWithdrawn6 ?? 0;
        if (s.titleIvTransfCompleted6 === null && s.titleIvTransfCompleted2yr6 === null && s.titleIvTransfWithdrawn6 === null) return null;
        return a + b + c;
      })
      .filter((v): v is number => v !== null);

    return {
      medRet: median(ret),
      nRet: ret.length,
      medCompleted: median(completed6),
      nCompleted: completed6.length,
      medWithdrawn: median(withdrawn6),
      nWithdrawn: withdrawn6.length,
      medTransferred: median(transferred),
      nTransferred: transferred.length,
    };
  }, [schools]);

  // ----- Cohort breakdown for selected schools (or top 10 by enrollment) -----
  const cohortRows = useMemo(() => {
    const target = selectedSchools.length > 0 ? selectedSchools : [];
    return target
      .map((s) => {
        const c = s.titleIvCompleted6;
        const tc = (s.titleIvTransfCompleted6 ?? 0) + (s.titleIvTransfCompleted2yr6 ?? 0);
        const se = s.titleIvStillEnrolled6;
        const w = s.titleIvWithdrawn6;
        const tw = s.titleIvTransfWithdrawn6;
        const u = s.titleIvUnknown6;
        const hasData = c !== null || w !== null || se !== null;
        return {
          name: shortLabel(s.name),
          fullName: s.name,
          completed: c === null ? null : c * 100,
          transfCompleted: tc * 100,
          stillEnrolled: se === null ? null : se * 100,
          withdrawn: w === null ? null : w * 100,
          transfWithdrawn: tw === null ? null : tw * 100,
          unknown: u === null ? null : u * 100,
          hasData,
        };
      });
  }, [selectedSchools]);

  // ----- First-year retention histogram -----
  const retentionHist = useMemo(() => {
    const buckets = [
      { label: '<60%', lo: 0, hi: 0.6 },
      { label: '60–70%', lo: 0.6, hi: 0.7 },
      { label: '70–80%', lo: 0.7, hi: 0.8 },
      { label: '80–90%', lo: 0.8, hi: 0.9 },
      { label: '90–95%', lo: 0.9, hi: 0.95 },
      { label: '95%+', lo: 0.95, hi: 1.01 },
    ].map((b) => ({ ...b, count: 0 }));
    let n = 0;
    for (const s of schools) {
      const r = bestRetention(s);
      if (r === null) continue;
      n++;
      const b = buckets.find((x) => r >= x.lo && r < x.hi);
      if (b) b.count++;
    }
    return { buckets, n };
  }, [schools]);

  // ----- Retention vs 6-yr completion scatter -----
  const scatterData = useMemo(() => {
    return schools
      .map((s) => {
        const r = bestRetention(s);
        const c = s.titleIvCompleted6;
        if (r === null || c === null) return null;
        return {
          x: r * 100,
          y: c * 100,
          size: s.size ?? 1000,
          ownership: s.ownership,
          name: s.name,
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

  // ----- Withdrawal histogram -----
  const withdrawHist = useMemo(() => {
    const buckets = [
      { label: '<5%', lo: 0, hi: 0.05 },
      { label: '5–10%', lo: 0.05, hi: 0.1 },
      { label: '10–20%', lo: 0.1, hi: 0.2 },
      { label: '20–30%', lo: 0.2, hi: 0.3 },
      { label: '30–50%', lo: 0.3, hi: 0.5 },
      { label: '50%+', lo: 0.5, hi: 1.01 },
    ].map((b) => ({ ...b, count: 0 }));
    let n = 0;
    for (const s of schools) {
      if (s.titleIvWithdrawn6 === null) continue;
      n++;
      const b = buckets.find((x) => s.titleIvWithdrawn6! >= x.lo && s.titleIvWithdrawn6! < x.hi);
      if (b) b.count++;
    }
    return { buckets, n };
  }, [schools]);

  // ----- Worst-withdrawal table -----
  const topWithdrawn = useMemo(() => {
    return [...schools]
      .filter((s) => s.titleIvWithdrawn6 !== null)
      .sort((a, b) => b.titleIvWithdrawn6! - a.titleIvWithdrawn6!)
      .slice(0, 25);
  }, [schools]);

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Came back for year 2"
          tip="first-year-retention"
          value={fmtPct(summary.medRet)}
          sub={`median across ${summary.nRet.toLocaleString()} schools`}
        />
        <StatCard
          label="Finished within 6 years"
          tip="completion-6yr"
          value={fmtPct(summary.medCompleted)}
          sub={`${summary.nCompleted.toLocaleString()} reporting`}
        />
        <StatCard
          label="Left without a degree"
          tip="withdrawal-rate"
          value={fmtPct(summary.medWithdrawn)}
          sub={`${summary.nWithdrawn.toLocaleString()} reporting`}
        />
        <StatCard
          label="Transferred elsewhere"
          tip="transfer-out"
          value={fmtPct(summary.medTransferred)}
          sub="completed + withdrew at another school"
        />
      </div>

      <Accordion>
        {/* Cohort breakdown (selected) */}
        <AccordionSection id="retention.cohortOutcomes" title="6-year cohort outcomes — selected schools">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            6-year cohort outcomes — selected schools
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Tracks every Title-IV first-time student in the entering cohort. Bars sum to ≈100%
            (rounding & suppression aside). Hover for exact values.
          </p>
          {cohortRows.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              Select schools in the table below to see their cohort outcomes.
            </div>
          ) : cohortRows.every((r) => !r.hasData) ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              None of the selected schools report Title-IV cohort tracking.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(180, cohortRows.length * 56)}
            >
              <BarChart
                data={cohortRows}
                layout="vertical"
                margin={{ top: 8, right: 20, bottom: 8, left: 8 }}
              >
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  width={150}
                />
                <Tooltip
                  formatter={(v) =>
                    v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`
                  }
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {COHORT_BUCKETS.map((b) => (
                  <Bar key={b.key} dataKey={b.key} stackId="cohort" fill={b.color} name={b.label} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        </AccordionSection>

        {/* First-year retention histogram */}
        <AccordionSection id="retention.firstYearDistribution" title="First-year retention distribution">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            First-year retention distribution
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Full-time first-year students returning for year two. {retentionHist.n.toLocaleString()}{' '}
            schools reporting.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={retentionHist.buckets}
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
                {retentionHist.buckets.map((_b, i) => (
                  <Cell
                    key={i}
                    fill={`rgb(${Math.round(220 - i * 25)},${Math.round(80 + i * 25)},${Math.round(80 + i * 10)})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        </AccordionSection>

        {/* Withdrawal histogram */}
        <AccordionSection id="retention.withdrawalDistribution" title="6-year withdrawal distribution">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            6-year withdrawal distribution
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Share of the entering Title-IV cohort that withdrew without finishing — at the same
            institution. {withdrawHist.n.toLocaleString()} schools reporting.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={withdrawHist.buckets}
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
                {withdrawHist.buckets.map((_b, i) => (
                  <Cell
                    key={i}
                    fill={`rgb(${Math.round(80 + i * 35)},${Math.round(180 - i * 28)},${Math.round(140 - i * 22)})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        </AccordionSection>

        {/* Retention vs 6yr completion scatter */}
        <AccordionSection id="retention.retentionVsCompletion" title="First-year retention vs. 6-year completion">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            First-year retention vs. 6-year completion
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Each dot = a school. Schools well *below* the dashed parity line keep first-year
            students but lose them between year 2 and year 6 — late-stage leakage. Bubble size = enrollment.
          </p>
          {scatterData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              No schools with both retention and 6-yr completion data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="First-year retention"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="6-yr completion"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${v}%`}
                />
                <ZAxis type="number" dataKey="size" range={[40, 400]} />
                <ReferenceLine
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  segment={[
                    { x: 0, y: 0 },
                    { x: 100, y: 100 },
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
                        <div>1-yr retention: {d.x.toFixed(1)}%</div>
                        <div>6-yr completion: {d.y.toFixed(1)}%</div>
                        <div>Late-stage drop: {(d.x - d.y).toFixed(1)} pp</div>
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
        </AccordionSection>
      </Accordion>

      {/* Top-withdrawal table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">
            Highest 6-year withdrawal in the filter
          </h3>
        </div>
        <div className="max-h-[440px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {[
                  'School',
                  '1-yr retention',
                  'Completed',
                  'Transferred + completed',
                  'Withdrew',
                  'Still enrolled',
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
              {topWithdrawn.map((s) => {
                const tc = (s.titleIvTransfCompleted6 ?? 0) + (s.titleIvTransfCompleted2yr6 ?? 0);
                return (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(bestRetention(s))}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.titleIvCompleted6)}</td>
                    <td className="px-3 py-2 tabular-nums">{tc === 0 ? '—' : `${(tc * 100).toFixed(1)}%`}</td>
                    <td className="px-3 py-2 tabular-nums text-rose-700">
                      {fmtPct(s.titleIvWithdrawn6)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {fmtPct(s.titleIvStillEnrolled6)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

