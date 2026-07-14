import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type {
  AggregateHistory,
  School,
  SchoolHistory,
  SearchFilters,
  TrendMetricKey,
} from '../api/scorecard';
import { TREND_METRICS, fetchSchoolHistory, fetchHistoryAggregate } from '../api/scorecard';
import { fmtMoney, fmtNum, fmtPct } from '../util/format';
import { Accordion, AccordionSection } from '../components/Accordion';

interface Props {
  filters: SearchFilters;
  selectedSchools: School[];
}

const PALETTE = ['#6D5EF0', '#2F6FEB', '#16A34A', '#F59E0B', '#E0483D'];
const AGGREGATE_KEY = 'All filtered colleges (avg)';
const AGGREGATE_COLOR = '#0f172a';

const YEAR_RANGES = [
  { label: '10 yrs', start: 2014, end: 2023 },
  { label: '20 yrs', start: 2004, end: 2023 },
  { label: 'All', start: 1996, end: 2023 },
] as const;

function formatValue(v: number | null | undefined, format: string): string {
  if (v === null || v === undefined) return '—';
  if (format === 'money') return fmtMoney(v);
  if (format === 'pct') return fmtPct(v);
  return fmtNum(v);
}

function yAxisTick(format: string): (v: number) => string {
  if (format === 'money') return (v) => `$${(v / 1000).toFixed(0)}k`;
  if (format === 'pct') return (v) => `${(v * 100).toFixed(0)}%`;
  return (v) => v.toLocaleString();
}

export function TrendsTab({ filters, selectedSchools }: Props) {
  const [metric, setMetric] = useState<TrendMetricKey>('tuitionIn');
  const [rangeIdx, setRangeIdx] = useState(0);
  const [showAggregate, setShowAggregate] = useState(true);

  const [histories, setHistories] = useState<SchoolHistory[]>([]);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [errorSelected, setErrorSelected] = useState<string | null>(null);

  const [aggregate, setAggregate] = useState<AggregateHistory | null>(null);
  const [aggLoading, setAggLoading] = useState(false);
  const [aggProgress, setAggProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [aggError, setAggError] = useState<string | null>(null);

  const range = YEAR_RANGES[rangeIdx];
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = range.start; y <= range.end; y++) arr.push(y);
    return arr;
  }, [range]);

  const selectedIds = selectedSchools.map((s) => s.id).join(',');
  const filterKey = JSON.stringify(filters);

  // Fetch history for individually selected schools
  useEffect(() => {
    if (selectedSchools.length === 0) {
      setHistories([]);
      return;
    }
    const controller = new AbortController();
    setLoadingSelected(true);
    setErrorSelected(null);
    fetchSchoolHistory(
      selectedSchools.map((s) => s.id),
      years,
    )
      .then((r) => {
        if (controller.signal.aborted) return;
        setHistories(r);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted) return;
        setErrorSelected(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSelected(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, years]);

  // Fetch aggregate across all filtered colleges (metric-specific, paginated)
  useEffect(() => {
    if (!showAggregate) return;
    const controller = new AbortController();
    setAggLoading(true);
    setAggError(null);
    setAggProgress(null);
    fetchHistoryAggregate(filters, metric, years, {
      signal: controller.signal,
      onProgress: (p) => {
        if (controller.signal.aborted) return;
        setAggProgress(p);
      },
    })
      .then((r) => {
        if (controller.signal.aborted) return;
        setAggregate(r);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted || e.name === 'AbortError') return;
        setAggError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAggLoading(false);
          setAggProgress(null);
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, metric, years, showAggregate]);

  const metricDef = TREND_METRICS[metric];

  const chartData = years.map((y) => {
    const row: Record<string, string | number | null> = { year: y };
    for (const h of histories) {
      const pt = h.series[metric].find((p) => p.year === y);
      row[h.name] = pt?.value ?? null;
    }
    if (showAggregate && aggregate) {
      const pt = aggregate.perYear.find((p) => p.year === y);
      row[AGGREGATE_KEY] = pt?.mean ?? null;
    }
    return row;
  });

  const anyData = chartData.some(
    (row) =>
      histories.some((h) => {
        const v = row[h.name];
        return v !== null && v !== undefined;
      }) ||
      (showAggregate && row[AGGREGATE_KEY] !== null && row[AGGREGATE_KEY] !== undefined),
  );

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as TrendMetricKey)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {(Object.keys(TREND_METRICS) as TrendMetricKey[]).map((k) => (
                <option key={k} value={k}>
                  {TREND_METRICS[k].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Range</label>
            <div className="inline-flex rounded border border-slate-300 text-xs overflow-hidden">
              {YEAR_RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setRangeIdx(i)}
                  className={`px-3 py-2 ${
                    rangeIdx === i
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aggregate</label>
            <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded border border-slate-300 bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={showAggregate}
                onChange={(e) => setShowAggregate(e.target.checked)}
              />
              Show all-college average
            </label>
          </div>
        </div>
      </div>

      <Accordion>
        <AccordionSection id="trends.metricOverTime" title={`${metricDef.label} over time`}>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        {(loadingSelected || aggLoading) && (
          <div className="text-xs text-slate-500 mb-2">
            {aggLoading && aggProgress
              ? `Loading history for ${aggProgress.loaded.toLocaleString()} of ${aggProgress.total.toLocaleString()} colleges…`
              : 'Loading…'}
          </div>
        )}
        {aggLoading && aggProgress && aggProgress.total > 0 && (
          <div className="h-1 bg-slate-200 rounded overflow-hidden mb-3">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{
                width: `${Math.min(100, (aggProgress.loaded / aggProgress.total) * 100)}%`,
              }}
            />
          </div>
        )}
        {(errorSelected || aggError) && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded p-2 mb-3">
            {errorSelected || aggError}
          </div>
        )}

        <p className="text-xs text-slate-500 mb-3">
          Thin lines: selected schools. Thick dark line: average across all{' '}
          {aggregate?.totalSchools?.toLocaleString() ?? ''} filtered colleges.
        </p>

        {!anyData && !loadingSelected && !aggLoading ? (
          <div className="h-[340px] flex items-center justify-center text-slate-400 text-sm">
            No historical data for this metric.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={yAxisTick(metricDef.format)}
              />
              <Tooltip
                formatter={(v) => formatValue(v === null ? null : Number(v), metricDef.format)}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {histories.map((h, i) => (
                <Line
                  key={h.id}
                  type="monotone"
                  dataKey={h.name}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
              {showAggregate && aggregate && (
                <Line
                  type="monotone"
                  dataKey={AGGREGATE_KEY}
                  stroke={AGGREGATE_COLOR}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
        </AccordionSection>

        {showAggregate && aggregate && (
          <AccordionSection
            id="trends.aggregateSummary"
            title={`${metricDef.label} — averages across ${aggregate.totalSchools.toLocaleString()} filtered colleges`}
          >
            <AggregateSummary
              agg={aggregate}
              format={metricDef.format}
              firstYear={years[0]}
              lastYear={years[years.length - 1]}
              metricLabel={metricDef.label}
            />
          </AccordionSection>
        )}

        {histories.length > 0 && (
          <AccordionSection
            id="trends.changeOverRange"
            title="Change over range — selected schools"
          >
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Change over range — selected schools
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-1.5 pr-4">School</th>
                  <th className="py-1.5 pr-4">First year w/ data</th>
                  <th className="py-1.5 pr-4">Latest value</th>
                  <th className="py-1.5 pr-4">Change</th>
                  <th className="py-1.5 pr-4">% change</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {histories.map((h, i) => {
                  const series = h.series[metric];
                  const first = series.find((p) => p.value !== null);
                  const last = [...series].reverse().find((p) => p.value !== null);
                  const change =
                    first && last && first.value !== null && last.value !== null
                      ? last.value - first.value
                      : null;
                  const pct =
                    first && last && first.value && last.value !== null
                      ? (last.value - first.value) / first.value
                      : null;
                  return (
                    <tr key={h.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-4">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{ background: PALETTE[i % PALETTE.length] }}
                        />
                        {h.name}
                      </td>
                      <td className="py-1.5 pr-4 text-slate-500">
                        {first ? `${first.year}: ${formatValue(first.value, metricDef.format)}` : '—'}
                      </td>
                      <td className="py-1.5 pr-4">
                        {last ? `${last.year}: ${formatValue(last.value, metricDef.format)}` : '—'}
                      </td>
                      <td
                        className={`py-1.5 pr-4 ${
                          change === null
                            ? ''
                            : change > 0
                            ? 'text-emerald-700'
                            : change < 0
                            ? 'text-rose-700'
                            : ''
                        }`}
                      >
                        {change === null
                          ? '—'
                          : `${change > 0 ? '+' : ''}${formatValue(Math.abs(change), metricDef.format).replace('-', '')}`}
                      </td>
                      <td
                        className={`py-1.5 pr-4 ${
                          pct === null
                            ? ''
                            : pct > 0
                            ? 'text-emerald-700'
                            : pct < 0
                            ? 'text-rose-700'
                            : ''
                        }`}
                      >
                        {pct === null ? '—' : `${pct > 0 ? '+' : ''}${(pct * 100).toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          </AccordionSection>
        )}
      </Accordion>
    </>
  );
}

interface AggregateSummaryProps {
  agg: AggregateHistory;
  format: string;
  firstYear: number;
  lastYear: number;
  metricLabel: string;
}

function AggregateSummary({
  agg,
  format,
  firstYear,
  lastYear,
  metricLabel,
}: AggregateSummaryProps) {
  const formatV = (v: number | null | undefined) =>
    v === null || v === undefined
      ? '—'
      : format === 'money'
      ? fmtMoney(v)
      : format === 'pct'
      ? fmtPct(v)
      : fmtNum(v);

  const changeColor =
    agg.avgChange === null
      ? ''
      : agg.avgChange > 0
      ? 'text-emerald-700'
      : agg.avgChange < 0
      ? 'text-rose-700'
      : '';
  const pctColor =
    agg.medianPctChange === null
      ? ''
      : agg.medianPctChange > 0
      ? 'text-emerald-700'
      : agg.medianPctChange < 0
      ? 'text-rose-700'
      : '';

  const formatChange = (v: number | null) => {
    if (v === null) return '—';
    const sign = v > 0 ? '+' : v < 0 ? '-' : '';
    const abs = Math.abs(v);
    return `${sign}${format === 'money' ? fmtMoney(abs) : format === 'pct' ? fmtPct(abs) : fmtNum(abs)}`;
  };

  const cards = [
    {
      label: `Avg in ${firstYear}`,
      value: formatV(agg.avgFirst),
      sub: `${agg.perYear[0]?.n.toLocaleString() ?? 0} schools reporting`,
    },
    {
      label: `Avg in ${lastYear}`,
      value: formatV(agg.avgLast),
      sub: `${agg.perYear[agg.perYear.length - 1]?.n.toLocaleString() ?? 0} schools reporting`,
    },
    {
      label: 'Avg change per school',
      value: formatChange(agg.avgChange),
      sub: `${agg.nWithChange.toLocaleString()} schools w/ endpoints`,
      className: changeColor,
    },
    {
      label: 'Median % change',
      value:
        agg.medianPctChange === null
          ? '—'
          : `${agg.medianPctChange > 0 ? '+' : ''}${(agg.medianPctChange * 100).toFixed(1)}%`,
      sub: 'across schools with both endpoints',
      className: pctColor,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">
        {metricLabel} — averages across {agg.totalSchools.toLocaleString()} filtered colleges
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Per-school endpoints use each school's earliest and latest reported value within the selected range.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-slate-200 p-3 bg-slate-50/60"
          >
            <div className="text-xs text-slate-500">{c.label}</div>
            <div
              className={`text-xl font-semibold tabular-nums mt-1 ${
                c.className ?? 'text-slate-900'
              }`}
            >
              {c.value}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
