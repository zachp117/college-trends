import { useMemo, useState } from 'react';
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
} from 'recharts';
import type { School } from '../api/scorecard';
import { OWNERSHIP_LABELS } from '../api/scorecard';
import { fmtMoney, fmtPct } from '../util/format';
import { StatCard } from '../components/StatCard';
import { Accordion, AccordionSection } from '../components/Accordion';

interface Props {
  schools: School[];
  selectedSchools: School[];
}

const OWNERSHIP_COLOR: Record<number, string> = {
  1: '#2F6FEB',
  2: '#16A34A',
  3: '#E0483D',
};

type Horizon = '6yr' | '10yr';

interface Percentiles {
  p10: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  p90: number | null;
}

function pctOf(s: School, horizon: Horizon): Percentiles {
  if (horizon === '10yr') {
    return {
      p10: s.earnings10P10,
      p25: s.earnings10P25,
      median: s.medianEarnings10,
      p75: s.earnings10P75,
      p90: s.earnings10P90,
    };
  }
  return {
    p10: s.earnings6P10,
    p25: s.earnings6P25,
    median: s.earnings6MedianTrue,
    p75: s.earnings6P75,
    p90: s.earnings6P90,
  };
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function shortLabel(name: string): string {
  return name.length > 22 ? name.slice(0, 20) + '…' : name;
}

export function EarningsDistributionTab({ schools, selectedSchools }: Props) {
  const [horizon, setHorizon] = useState<Horizon>('10yr');

  // Summary stats
  const summary = useMemo(() => {
    const medians: number[] = [];
    const iqrs: number[] = [];
    const p90s: number[] = [];
    const above25: number[] = [];
    const above28: number[] = [];
    for (const s of schools) {
      const p = pctOf(s, horizon);
      if (p.median !== null) medians.push(p.median);
      if (p.p25 !== null && p.p75 !== null) iqrs.push(p.p75 - p.p25);
      if (p.p90 !== null) p90s.push(p.p90);
      const t25 = horizon === '10yr' ? s.threshold10_25k : s.threshold6_25k;
      const t28 = horizon === '10yr' ? s.threshold10_28k : s.threshold6_28k;
      if (t25 !== null) above25.push(t25);
      if (t28 !== null) above28.push(t28);
    }
    return {
      medMedian: median(medians),
      nMedian: medians.length,
      medIQR: median(iqrs),
      nIQR: iqrs.length,
      medP90: median(p90s),
      nP90: p90s.length,
      medAbove25: median(above25),
      medAbove28: median(above28),
    };
  }, [schools, horizon]);

  // Range chart for selected schools
  const rangeData = useMemo(() => {
    return selectedSchools.map((s) => {
      const p = pctOf(s, horizon);
      const has = p.p10 !== null && p.p90 !== null;
      return {
        name: shortLabel(s.name),
        fullName: s.name,
        ...p,
        // For stacked bars: base (0 to p10), p10-p25, p25-p75 (IQR), p75-p90
        base: p.p10 ?? 0,
        lowSeg: p.p10 !== null && p.p25 !== null ? p.p25 - p.p10 : 0,
        midSeg: p.p25 !== null && p.p75 !== null ? p.p75 - p.p25 : 0,
        highSeg: p.p75 !== null && p.p90 !== null ? p.p90 - p.p75 : 0,
        hasData: has,
      };
    });
  }, [selectedSchools, horizon]);

  const rangeMin = useMemo(() => {
    const vals = rangeData
      .filter((d) => d.hasData)
      .map((d) => d.p10)
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    return Math.max(0, Math.floor(Math.min(...vals) / 5000) * 5000 - 5000);
  }, [rangeData]);

  const rangeMax = useMemo(() => {
    const vals = rangeData
      .filter((d) => d.hasData)
      .map((d) => d.p90)
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return 100000;
    return Math.ceil(Math.max(...vals) / 10000) * 10000;
  }, [rangeData]);

  // Spread vs median scatter
  const spreadScatter = useMemo(() => {
    return schools
      .map((s) => {
        const p = pctOf(s, horizon);
        if (p.median === null || p.p25 === null || p.p75 === null) return null;
        return {
          x: p.median,
          y: p.p75 - p.p25,
          name: s.name,
          size: s.size ?? 1000,
          ownership: s.ownership,
          p10: p.p10,
          p90: p.p90,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [schools, horizon]);

  const scatterByOwnership = useMemo(() => {
    const map = new Map<number, typeof spreadScatter>();
    for (const d of spreadScatter) {
      const arr = map.get(d.ownership) ?? [];
      arr.push(d);
      map.set(d.ownership, arr);
    }
    return map;
  }, [spreadScatter]);

  // Threshold bars per selected school
  const thresholdData = useMemo(() => {
    if (selectedSchools.length === 0) return [];
    return selectedSchools.map((s) => {
      const t25 = horizon === '10yr' ? s.threshold10_25k : s.threshold6_25k;
      const t28 = horizon === '10yr' ? s.threshold10_28k : s.threshold6_28k;
      return {
        name: shortLabel(s.name),
        fullName: s.name,
        '> $25k': t25 === null ? null : t25 * 100,
        '> $28k': t28 === null ? null : t28 * 100,
      };
    });
  }, [selectedSchools, horizon]);

  // Distribution histogram across filter
  const medianHist = useMemo(() => {
    const buckets = [
      { label: '<$25k', lo: 0, hi: 25000 },
      { label: '$25–35k', lo: 25000, hi: 35000 },
      { label: '$35–45k', lo: 35000, hi: 45000 },
      { label: '$45–55k', lo: 45000, hi: 55000 },
      { label: '$55–70k', lo: 55000, hi: 70000 },
      { label: '$70–90k', lo: 70000, hi: 90000 },
      { label: '$90k+', lo: 90000, hi: Infinity },
    ].map((b) => ({ ...b, median: 0, p90: 0 }));
    for (const s of schools) {
      const p = pctOf(s, horizon);
      if (p.median !== null) {
        const b = buckets.find((x) => p.median! >= x.lo && p.median! < x.hi);
        if (b) b.median++;
      }
      if (p.p90 !== null) {
        const b = buckets.find((x) => p.p90! >= x.lo && p.p90! < x.hi);
        if (b) b.p90++;
      }
    }
    return buckets;
  }, [schools, horizon]);

  // Top 25 by p90 across filter
  const topByP90 = useMemo(() => {
    return schools
      .map((s) => ({ s, p: pctOf(s, horizon) }))
      .filter((x) => x.p.p90 !== null)
      .sort((a, b) => b.p.p90! - a.p.p90!)
      .slice(0, 25);
  }, [schools, horizon]);

  return (
    <>
      {/* Horizon toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-slate-600">
          Showing earnings <span className="font-medium">{horizon === '10yr' ? '10 years' : '6 years'}</span> after entry.
        </div>
        <div className="inline-flex rounded border border-slate-300 text-xs overflow-hidden">
          <button
            onClick={() => setHorizon('6yr')}
            className={`px-3 py-1.5 ${
              horizon === '6yr'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            6 years
          </button>
          <button
            onClick={() => setHorizon('10yr')}
            className={`px-3 py-1.5 ${
              horizon === '10yr'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            10 years
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Typical grad's earnings"
          tip="median"
          value={fmtMoney(summary.medMedian)}
          sub={`median across ${summary.nMedian.toLocaleString()} schools`}
        />
        <StatCard
          label="Middle-50% spread"
          tip="iqr"
          value={fmtMoney(summary.medIQR)}
          sub="gap between 25th and 75th percentile grads"
        />
        <StatCard
          label="What top earners make"
          tip="percentile"
          value={fmtMoney(summary.medP90)}
          sub="90th percentile — top earners' floor"
        />
        <StatCard
          label="% out-earning a HS grad"
          tip="threshold-25k"
          value={fmtPct(summary.medAbove25)}
          sub="grads earning above ~$25k/year"
        />
      </div>

      <Accordion>
        {/* Range chart for selected */}
        <AccordionSection id="earnings.range" title="Earnings distribution — selected schools">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Earnings distribution — selected schools
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Bar spans the 10th to 90th percentile. Dark middle band is the IQR (25th – 75th). Bigger spread = wider variation in grad outcomes.
          </p>
          {rangeData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              Select schools in the table below to see their earnings distributions.
            </div>
          ) : rangeData.every((d) => !d.hasData) ? (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              None of the selected schools report a {horizon} earnings distribution.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(180, rangeData.length * 60)}
            >
              <BarChart
                data={rangeData}
                layout="vertical"
                margin={{ top: 10, right: 30, bottom: 10, left: 10 }}
                barCategoryGap="35%"
              >
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[rangeMin, rangeMax]}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  width={150}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const d = payload[0].payload as {
                      fullName: string;
                      p10: number | null;
                      p25: number | null;
                      median: number | null;
                      p75: number | null;
                      p90: number | null;
                    };
                    return (
                      <div className="bg-white border border-slate-200 rounded p-2 text-xs shadow">
                        <div className="font-medium">{d.fullName}</div>
                        <div>10th: {fmtMoney(d.p10)}</div>
                        <div>25th: {fmtMoney(d.p25)}</div>
                        <div>Median: {fmtMoney(d.median)}</div>
                        <div>75th: {fmtMoney(d.p75)}</div>
                        <div>90th: {fmtMoney(d.p90)}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="base" stackId="rng" fill="transparent" />
                <Bar dataKey="lowSeg" stackId="rng" fill="rgba(109,94,240,0.35)" />
                <Bar dataKey="midSeg" stackId="rng" fill="#6D5EF0" />
                <Bar dataKey="highSeg" stackId="rng" fill="rgba(109,94,240,0.35)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        </AccordionSection>

        {/* Spread vs median scatter */}
        <AccordionSection id="earnings.spreadVsMedian" title="Earnings spread vs. median (across filter)">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Earnings spread vs. median (across filter)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            X = median earnings · Y = IQR (75th − 25th, the spread of the middle 50%).
            Schools high on Y at low X = highly variable outcomes for typical grads.
          </p>
          {spreadScatter.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              No schools report enough percentile data for this filter.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Median"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="IQR"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
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
                      p10: number | null;
                      p90: number | null;
                    };
                    return (
                      <div className="bg-white border border-slate-200 rounded p-2 text-xs shadow">
                        <div className="font-medium">{d.name}</div>
                        <div>Median: {fmtMoney(d.x)}</div>
                        <div>IQR: {fmtMoney(d.y)}</div>
                        <div>10th: {fmtMoney(d.p10)} · 90th: {fmtMoney(d.p90)}</div>
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
                    fill={OWNERSHIP_COLOR[own] ?? '#6D5EF0'}
                    fillOpacity={0.6}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
        </AccordionSection>

        {/* Threshold bars */}
        {thresholdData.length > 0 && (
          <AccordionSection id="earnings.thresholds" title="Share of grads earning above thresholds — selected schools">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">
              Share of grads earning above thresholds — selected schools
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Both thresholds approximate "earns more than a typical high-school graduate."
            </p>
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, thresholdData.length * 60)}
            >
              <BarChart
                data={thresholdData}
                margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
              >
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  angle={thresholdData.length > 1 ? -15 : 0}
                  textAnchor={thresholdData.length > 1 ? 'end' : 'middle'}
                  height={thresholdData.length > 1 ? 60 : 30}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) =>
                    v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`
                  }
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="> $25k" fill="#2F6FEB" radius={[3, 3, 0, 0]} />
                <Bar dataKey="> $28k" fill="#6D5EF0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </AccordionSection>
        )}

        {/* Distribution histogram */}
        <AccordionSection id="earnings.percentiles" title="Distribution of school medians vs. 90th percentiles">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Distribution of school medians vs. 90th percentiles
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            How many schools fall into each earnings band, separately for typical (median) grads
            and top earners (90th percentile).
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={medianHist} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip
                formatter={(v: number, name: string) => [v, name]}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="median" name="Schools by median" fill="#6D5EF0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="p90" name="Schools by 90th percentile" fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </AccordionSection>
      </Accordion>

      {/* Top by p90 table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">
            Top 25 by 90th percentile earnings
          </h3>
        </div>
        <div className="max-h-[440px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {['School', '10th', '25th', 'Median', '75th', '90th', '> $25k', '> $28k'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {topByP90.map(({ s, p }) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(p.p10)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(p.p25)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(p.median)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(p.p75)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(p.p90)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {fmtPct(
                      horizon === '10yr' ? s.threshold10_25k : s.threshold6_25k,
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {fmtPct(
                      horizon === '10yr' ? s.threshold10_28k : s.threshold6_28k,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


