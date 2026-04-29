import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import type { Program, School } from '../api/scorecard';
import { CREDENTIAL_LABELS, fetchSchoolPrograms } from '../api/scorecard';
import { fmtMoney, fmtNum } from '../util/format';

interface Props {
  selectedSchools: School[];
}

const PALETTE = ['#6366f1', '#0ea5e9', '#059669', '#f59e0b', '#dc2626'];
const COMMON_CREDENTIALS = [1, 2, 3, 5, 6, 7];

type MetricKey = keyof Pick<
  Program,
  | 'earnings1yr'
  | 'earnings4yr'
  | 'earnings5yr'
  | 'completers'
  | 'medianDebt'
  | 'monthlyPayment'
  | 'debtToIncome5yr'
  | 'employmentRate1yr'
  | 'inStateRate1yr'
  | 'gradSchoolRate5yr'
  | 'genderGap5yr'
  | 'pellGap5yr'
>;

interface MetricDef {
  key: MetricKey;
  label: string;
  format: 'money' | 'pct' | 'num';
  higherBetter: boolean;
}

const METRICS: MetricDef[] = [
  { key: 'earnings5yr', label: '5-yr earnings', format: 'money', higherBetter: true },
  { key: 'earnings1yr', label: '1-yr earnings', format: 'money', higherBetter: true },
  { key: 'earnings4yr', label: '4-yr earnings', format: 'money', higherBetter: true },
  { key: 'completers', label: 'Completers/yr', format: 'num', higherBetter: true },
  { key: 'medianDebt', label: 'Median debt', format: 'money', higherBetter: false },
  { key: 'monthlyPayment', label: 'Monthly payment', format: 'money', higherBetter: false },
  {
    key: 'debtToIncome5yr',
    label: 'Debt-to-income (5y)',
    format: 'pct',
    higherBetter: false,
  },
  { key: 'employmentRate1yr', label: 'Employment rate (1y)', format: 'pct', higherBetter: true },
  { key: 'inStateRate1yr', label: '% working in-state (1y)', format: 'pct', higherBetter: true },
  {
    key: 'gradSchoolRate5yr',
    label: '% in grad school (5y)',
    format: 'pct',
    higherBetter: true,
  },
  {
    key: 'genderGap5yr',
    label: 'Gender earnings gap (5y)',
    format: 'money',
    higherBetter: false,
  },
  { key: 'pellGap5yr', label: 'Pell earnings gap (5y)', format: 'money', higherBetter: false },
];

const METRIC_BY_KEY: Record<MetricKey, MetricDef> = Object.fromEntries(
  METRICS.map((m) => [m.key, m]),
) as Record<MetricKey, MetricDef>;

function formatValue(v: number | null, format: MetricDef['format']): string {
  if (v === null || v === undefined) return '—';
  if (format === 'money') return fmtMoney(v);
  if (format === 'pct') return `${(v * 100).toFixed(1)}%`;
  return fmtNum(v);
}

function tickFormatter(format: MetricDef['format']): (v: number) => string {
  if (format === 'money') return (v) => `$${(v / 1000).toFixed(0)}k`;
  if (format === 'pct') return (v) => `${(v * 100).toFixed(0)}%`;
  return (v) => v.toLocaleString();
}

type SortKey =
  | 'title'
  | 'completers'
  | 'earnings1yr'
  | 'earnings5yr'
  | 'medianDebt'
  | 'employmentRate1yr'
  | 'debtToIncome5yr';

export function MajorsTab({ selectedSchools }: Props) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [credLevels, setCredLevels] = useState<number[]>([3]);
  const [search, setSearch] = useState('');
  const [spotlightCode, setSpotlightCode] = useState<string>('');
  const [topMetric, setTopMetric] = useState<MetricKey>('earnings5yr');
  const [topCount, setTopCount] = useState<number>(20);
  const [sortKey, setSortKey] = useState<SortKey>('earnings5yr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const selectedIds = selectedSchools.map((s) => s.id).join(',');
  const colorForSchool = useMemo(() => {
    const map = new Map<number, string>();
    selectedSchools.forEach((s, i) => map.set(s.id, PALETTE[i % PALETTE.length]));
    return map;
  }, [selectedSchools]);

  useEffect(() => {
    if (selectedSchools.length === 0) {
      setPrograms([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchSchoolPrograms(selectedSchools.map((s) => s.id))
      .then((r) => {
        if (controller.signal.aborted) return;
        setPrograms(r);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted) return;
        setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (credLevels.length > 0 && !credLevels.includes(p.credentialLevel)) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.code.includes(q)) return false;
      return true;
    });
  }, [programs, credLevels, search]);

  const programsByCode = useMemo(() => {
    const map = new Map<string, Program[]>();
    for (const p of filtered) {
      const key = `${p.code}|${p.credentialLevel}`;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [filtered]);

  const sharedPrograms = useMemo(() => {
    const shared: { key: string; title: string; credLevel: number; progs: Program[] }[] = [];
    programsByCode.forEach((progs, key) => {
      if (progs.length >= 2) {
        shared.push({
          key,
          title: progs[0].title,
          credLevel: progs[0].credentialLevel,
          progs,
        });
      }
    });
    shared.sort((a, b) => a.title.localeCompare(b.title));
    return shared;
  }, [programsByCode]);

  const spotlight = useMemo(() => {
    if (!spotlightCode) return null;
    return sharedPrograms.find((s) => s.key === spotlightCode) ?? null;
  }, [sharedPrograms, spotlightCode]);

  const topMetricDef = METRIC_BY_KEY[topMetric];
  const topPrograms = useMemo(() => {
    const withValue = filtered.filter((p) => p[topMetric] !== null);
    const sign = topMetricDef.higherBetter ? -1 : 1;
    withValue.sort((a, b) => sign * ((a[topMetric] as number) - (b[topMetric] as number)));
    return withValue.slice(0, topCount);
  }, [filtered, topMetric, topCount, topMetricDef.higherBetter]);

  const sortedTable = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey] as number | string | null;
      const bv = b[sortKey] as number | string | null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleCred = (v: number) =>
    setCredLevels((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  const sortHeader = (label: string, key: SortKey, align: 'left' | 'right' = 'left') => (
    <th
      onClick={() => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else {
          setSortKey(key);
          setSortDir('desc');
        }
      }}
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 cursor-pointer select-none hover:text-indigo-600 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {label} {sortKey === key && (sortDir === 'asc' ? '↑' : '↓')}
    </th>
  );

  if (selectedSchools.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-sm">
        <div className="text-base font-medium text-slate-700 mb-1">
          Pin schools to compare majors
        </div>
        <div>
          Check up to 5 schools in the table below. Each school publishes per-program data for every CIP-4 program it offers.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Search programs
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Computer Science, Nursing, 1107"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Credential level
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CREDENTIALS.map((v) => {
                const active = credLevels.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => toggleCred(v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {CREDENTIAL_LABELS[v] ?? `Level ${v}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Selected schools:{' '}
          {selectedSchools.map((s, i) => (
            <span key={s.id} className="inline-flex items-center mr-3">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              {s.name}
            </span>
          ))}
          {loading && <span className="ml-2">· loading programs…</span>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded p-2">
            {error}
          </div>
        )}
      </div>

      {/* Spotlight */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Program spotlight</h3>
            <p className="text-xs text-slate-500">
              Pick a program that at least 2 selected schools offer at the same credential level.
            </p>
          </div>
          <select
            value={spotlightCode}
            onChange={(e) => setSpotlightCode(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 text-sm bg-white min-w-[240px]"
          >
            <option value="">
              {sharedPrograms.length === 0
                ? 'No shared programs at selected credential'
                : `Pick a shared program (${sharedPrograms.length})`}
            </option>
            {sharedPrograms.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title} · {CREDENTIAL_LABELS[s.credLevel] ?? ''} ({s.progs.length} schools)
              </option>
            ))}
          </select>
        </div>

        {spotlight ? (
          <SpotlightView spotlight={spotlight} colorForSchool={colorForSchool} />
        ) : (
          <div className="text-xs text-slate-400 py-6 text-center">No program selected.</div>
        )}
      </div>

      {/* Top programs by metric */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              Top programs by {topMetricDef.label.toLowerCase()}
            </h3>
            <p className="text-xs text-slate-500">
              Ranked {topMetricDef.higherBetter ? 'highest → lowest' : 'most concerning first'}{' '}
              across the current filter. Bar color = school.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Metric</label>
              <select
                value={topMetric}
                onChange={(e) => setTopMetric(e.target.value as MetricKey)}
                className="rounded border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
              >
                {METRICS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Count</label>
              <select
                value={topCount}
                onChange={(e) => setTopCount(Number(e.target.value))}
                className="rounded border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    Top {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {topPrograms.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
            No programs have data for this metric in the current filter.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, topPrograms.length * 22)}>
            <BarChart
              data={topPrograms.map((p) => ({
                label: `${p.title} (${CREDENTIAL_LABELS[p.credentialLevel] ?? ''}) · ${p.schoolName.slice(0, 24)}`,
                val: p[topMetric],
              }))}
              layout="vertical"
              margin={{ top: 10, right: 30, bottom: 10, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={tickFormatter(topMetricDef.format)}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="#64748b"
                fontSize={10}
                width={340}
              />
              <Tooltip
                formatter={(v) => [
                  formatValue(v === null ? null : Number(v), topMetricDef.format),
                  topMetricDef.label,
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Bar dataKey="val" radius={[0, 3, 3, 0]}>
                {topPrograms.map((p, i) => (
                  <Cell key={i} fill={colorForSchool.get(p.schoolId) ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Full table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            All programs ({filtered.length.toLocaleString()})
          </h3>
          <div className="text-xs text-slate-500">Click column headers to sort</div>
        </div>
        <div className="max-h-[540px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {sortHeader('Program', 'title')}
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Credential
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  School
                </th>
                {sortHeader('Compl./yr', 'completers', 'right')}
                {sortHeader('1y earn', 'earnings1yr', 'right')}
                {sortHeader('5y earn', 'earnings5yr', 'right')}
                {sortHeader('Median debt', 'medianDebt', 'right')}
                {sortHeader('Empl. rate', 'employmentRate1yr', 'right')}
                {sortHeader('Debt/inc', 'debtToIncome5yr', 'right')}
              </tr>
            </thead>
            <tbody>
              {sortedTable.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                    No programs match these filters.
                  </td>
                </tr>
              )}
              {sortedTable.map((p, i) => (
                <tr
                  key={`${p.schoolId}-${p.code}-${p.credentialLevel}-${i}`}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 font-medium text-slate-800">{p.title}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {CREDENTIAL_LABELS[p.credentialLevel] ?? p.credentialTitle}
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                      style={{ background: colorForSchool.get(p.schoolId) ?? '#6366f1' }}
                    />
                    {p.schoolName}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(p.completers)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(p.earnings1yr)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(p.earnings5yr)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(p.medianDebt)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatValue(p.employmentRate1yr, 'pct')}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatValue(p.debtToIncome5yr, 'pct')}
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

function SpotlightView({
  spotlight,
  colorForSchool,
}: {
  spotlight: { title: string; credLevel: number; progs: Program[] };
  colorForSchool: Map<number, string>;
}) {
  const earningsData = spotlight.progs.map((p) => ({
    school: p.schoolName,
    '1-yr': p.earnings1yr,
    '4-yr': p.earnings4yr,
    '5-yr': p.earnings5yr,
    fill: colorForSchool.get(p.schoolId) ?? '#6366f1',
  }));

  const debtEmpData = spotlight.progs.map((p) => ({
    school: p.schoolName,
    'Median debt': p.medianDebt,
    'Monthly payment × 12': p.monthlyPayment === null ? null : p.monthlyPayment * 12,
  }));

  const equityData = spotlight.progs.map((p) => ({
    school: p.schoolName,
    Male: p.earnings5yrMale,
    Female: p.earnings5yrNonmale,
    Pell: p.earnings5yrPell,
    'Non-Pell': p.earnings5yrNonpell,
  }));

  return (
    <div className="space-y-5">
      <div className="text-sm font-medium text-slate-800">
        {spotlight.title}
        <span className="text-xs text-slate-500 font-normal ml-2">
          · {CREDENTIAL_LABELS[spotlight.credLevel] ?? ''}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div className="text-xs font-medium text-slate-600 mb-1">
            Earnings trajectory (median)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={earningsData}
              margin={{ top: 8, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="school"
                stroke="#64748b"
                fontSize={10}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) =>
                  v === null || v === undefined ? '—' : fmtMoney(Number(v))
                }
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="1-yr" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="4-yr" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="5-yr" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-600 mb-1">Debt & annual payments</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={debtEmpData}
              margin={{ top: 8, right: 10, bottom: 30, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="school"
                stroke="#64748b"
                fontSize={10}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) =>
                  v === null || v === undefined ? '—' : fmtMoney(Number(v))
                }
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Median debt" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Monthly payment × 12" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2">
          <div className="text-xs font-medium text-slate-600 mb-1">
            Equity — 5-yr earnings by gender & Pell status
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={equityData}
              margin={{ top: 8, right: 10, bottom: 40, left: 10 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="school"
                stroke="#64748b"
                fontSize={10}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) =>
                  v === null || v === undefined ? '—' : fmtMoney(Number(v))
                }
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Male" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Female" fill="#ec4899" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Non-Pell" fill="#14b8a6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Pell" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-1.5 pr-3">Metric</th>
              {spotlight.progs.map((p) => (
                <th key={p.schoolId} className="py-1.5 pr-3">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ background: colorForSchool.get(p.schoolId) ?? '#6366f1' }}
                  />
                  {p.schoolName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            <SRow label="Completers/yr" progs={spotlight.progs} fn={(p) => fmtNum(p.completers)} />
            <SRow label="1-yr earnings" progs={spotlight.progs} fn={(p) => fmtMoney(p.earnings1yr)} />
            <SRow label="5-yr earnings" progs={spotlight.progs} fn={(p) => fmtMoney(p.earnings5yr)} />
            <SRow
              label="Employment rate (1y)"
              progs={spotlight.progs}
              fn={(p) => formatValue(p.employmentRate1yr, 'pct')}
            />
            <SRow
              label="Working in-state (1y)"
              progs={spotlight.progs}
              fn={(p) => formatValue(p.inStateRate1yr, 'pct')}
            />
            <SRow
              label="In grad school (5y)"
              progs={spotlight.progs}
              fn={(p) => formatValue(p.gradSchoolRate5yr, 'pct')}
            />
            <SRow label="Median debt" progs={spotlight.progs} fn={(p) => fmtMoney(p.medianDebt)} />
            <SRow
              label="Monthly payment"
              progs={spotlight.progs}
              fn={(p) => fmtMoney(p.monthlyPayment)}
            />
            <SRow
              label="Debt-to-income (5y)"
              progs={spotlight.progs}
              fn={(p) => formatValue(p.debtToIncome5yr, 'pct')}
            />
            <SRow
              label="Gender gap (5y)"
              progs={spotlight.progs}
              fn={(p) => (p.genderGap5yr === null ? '—' : `+${fmtMoney(p.genderGap5yr)} male`)}
            />
            <SRow
              label="Pell gap (5y)"
              progs={spotlight.progs}
              fn={(p) => (p.pellGap5yr === null ? '—' : `+${fmtMoney(p.pellGap5yr)} non-Pell`)}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SRow({
  label,
  progs,
  fn,
}: {
  label: string;
  progs: Program[];
  fn: (p: Program) => string;
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-1.5 pr-3 text-slate-500">{label}</td>
      {progs.map((p) => (
        <td key={p.schoolId} className="py-1.5 pr-3 text-slate-800">
          {fn(p)}
        </td>
      ))}
    </tr>
  );
}
