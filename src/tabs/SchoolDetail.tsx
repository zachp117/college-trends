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
  LineChart,
  Line,
} from 'recharts';
import type { Program, School, SchoolHistory } from '../api/scorecard';
import {
  OWNERSHIP_LABELS,
  fetchSchoolHistory,
  fetchSchoolPrograms,
} from '../api/scorecard';
import { fmtMoney, fmtNum, fmtPct } from '../util/format';
import { InfoTooltip } from '../components/InfoTooltip';
import { SuppressionNote } from '../components/SuppressionNote';
import { AddToStudentMenu } from '../components/AddToStudentMenu';
import { useSession } from '../lib/auth-client';

interface Props {
  school: School;
  filterSchools: School[];
  onClose: () => void;
  onToggleSelect: (id: number) => void;
  isSelected: boolean;
  copyShareLink: () => void;
  copied: boolean;
}

const RACE_GROUPS = [
  { key: 'raceWhite', label: 'White', color: '#3b82f6' },
  { key: 'raceBlack', label: 'Black', color: '#7c3aed' },
  { key: 'raceHispanic', label: 'Hispanic', color: '#f59e0b' },
  { key: 'raceAsian', label: 'Asian', color: '#10b981' },
  { key: 'raceAian', label: 'AIAN', color: '#dc2626' },
  { key: 'raceNhpi', label: 'NHPI', color: '#ec4899' },
  { key: 'raceTwoMore', label: '2+ races', color: '#0ea5e9' },
  { key: 'raceNonResident', label: 'Non-resident', color: '#64748b' },
  { key: 'raceUnknown', label: 'Unknown', color: '#cbd5e1' },
] as const;

const FACULTY_RACE_GROUPS = [
  { key: 'facultyWhite', label: 'White', color: '#3b82f6' },
  { key: 'facultyBlack', label: 'Black', color: '#7c3aed' },
  { key: 'facultyHispanic', label: 'Hispanic', color: '#f59e0b' },
  { key: 'facultyAsian', label: 'Asian', color: '#10b981' },
  { key: 'facultyAian', label: 'AIAN', color: '#dc2626' },
  { key: 'facultyNhpi', label: 'NHPI', color: '#ec4899' },
  { key: 'facultyTwoMore', label: '2+ races', color: '#0ea5e9' },
  { key: 'facultyNonResident', label: 'Non-resident', color: '#64748b' },
  { key: 'facultyUnknown', label: 'Unknown', color: '#cbd5e1' },
] as const;

const TEST_POLICY_LABELS: Record<number, string> = {
  1: 'Required',
  2: 'Recommended',
  3: 'Neither required nor recommended',
  4: 'Do not know',
  5: 'Considered but not required',
};

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentileRank(value: number | null, all: number[]): number | null {
  if (value === null || all.length === 0) return null;
  const below = all.filter((v) => v < value).length;
  return Math.round((below / all.length) * 100);
}

interface ContextValue {
  value: number | null;
  filterMedian: number | null;
  pctRank: number | null;
}

function makeContext(
  school: School,
  filterSchools: School[],
  key: keyof School,
): ContextValue {
  const value = school[key] as number | null;
  const all = filterSchools
    .map((s) => s[key])
    .filter((v): v is number => typeof v === 'number');
  return {
    value,
    filterMedian: median(all),
    pctRank: percentileRank(value, all),
  };
}

export function SchoolDetail({
  school,
  filterSchools,
  onClose,
  onToggleSelect,
  isSelected,
  copyShareLink,
  copied,
}: Props) {
  // ---------- Async fetches: programs + history ----------
  const [programs, setPrograms] = useState<Program[]>([]);
  const [progLoading, setProgLoading] = useState(false);
  const [history, setHistory] = useState<SchoolHistory | null>(null);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProgLoading(true);
    fetchSchoolPrograms([school.id])
      .then((r) => {
        if (!cancelled) setPrograms(r);
      })
      .finally(() => {
        if (!cancelled) setProgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [school.id]);

  useEffect(() => {
    let cancelled = false;
    setHistLoading(true);
    const years: number[] = [];
    for (let y = 2004; y <= 2023; y++) years.push(y);
    fetchSchoolHistory([school.id], years)
      .then((r) => {
        if (!cancelled) setHistory(r[0] ?? null);
      })
      .finally(() => {
        if (!cancelled) setHistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [school.id]);

  // ---------- Headline stats ----------
  const headline = useMemo(
    () => ({
      size: makeContext(school, filterSchools, 'size'),
      admit: makeContext(school, filterSchools, 'admissionRate'),
      avgCost: makeContext(school, filterSchools, 'avgCost'),
      completion: makeContext(school, filterSchools, 'completionRate'),
      earnings: makeContext(school, filterSchools, 'medianEarnings10'),
      debt: makeContext(school, filterSchools, 'medianDebt'),
      defaultRate: makeContext(school, filterSchools, 'defaultRate3yr'),
      retention: makeContext(school, filterSchools, 'retentionFt4yr'),
    }),
    [school, filterSchools],
  );

  // ---------- Race composition ----------
  const studentRaceData = useMemo(() => {
    const row: Record<string, number | string> = { name: 'Students' };
    for (const g of RACE_GROUPS) {
      const v = school[g.key as keyof School] as number | null;
      row[g.label] = v === null ? 0 : v * 100;
    }
    return [row];
  }, [school]);

  const facultyRaceData = useMemo(() => {
    const row: Record<string, number | string> = { name: 'Faculty' };
    for (const g of FACULTY_RACE_GROUPS) {
      const v = school[g.key as keyof School] as number | null;
      row[g.label] = v === null ? 0 : v * 100;
    }
    return [row];
  }, [school]);

  const studentVsFaculty = useMemo(
    () => [...studentRaceData, ...facultyRaceData],
    [studentRaceData, facultyRaceData],
  );

  // ---------- Net price by income (bar) ----------
  const netPriceData = useMemo(() => {
    const labels = [
      { key: '0_30k', label: '<$30k' },
      { key: '30k_48k', label: '$30–48k' },
      { key: '48k_75k', label: '$48–75k' },
      { key: '75k_110k', label: '$75–110k' },
      { key: '110k_plus', label: '$110k+' },
    ];
    return labels.map((l) => ({
      label: l.label,
      'Net price': school.netPriceByIncome[l.key] ?? null,
    }));
  }, [school]);

  // ---------- Earnings distribution ----------
  const earningsDistData = useMemo(() => {
    return [
      {
        name: '6-yr',
        '10th': school.earnings6P10,
        '25th': school.earnings6P25,
        Median: school.earnings6MedianTrue,
        '75th': school.earnings6P75,
        '90th': school.earnings6P90,
      },
      {
        name: '10-yr',
        '10th': school.earnings10P10,
        '25th': school.earnings10P25,
        Median: school.medianEarnings10,
        '75th': school.earnings10P75,
        '90th': school.earnings10P90,
      },
    ];
  }, [school]);

  // ---------- Cohort outcomes ----------
  const cohortData = useMemo(() => {
    return [
      {
        name: '6-yr cohort',
        Completed: school.titleIvCompleted6 === null ? null : school.titleIvCompleted6 * 100,
        'Transf. completed':
          ((school.titleIvTransfCompleted6 ?? 0) + (school.titleIvTransfCompleted2yr6 ?? 0)) * 100,
        'Still enrolled':
          school.titleIvStillEnrolled6 === null ? null : school.titleIvStillEnrolled6 * 100,
        Withdrew: school.titleIvWithdrawn6 === null ? null : school.titleIvWithdrawn6 * 100,
        'Transf. withdrew':
          school.titleIvTransfWithdrawn6 === null ? null : school.titleIvTransfWithdrawn6 * 100,
        Unknown: school.titleIvUnknown6 === null ? null : school.titleIvUnknown6 * 100,
      },
    ];
  }, [school]);

  // ---------- Top programs ----------
  const topPrograms = useMemo(() => {
    return programs
      .filter((p) => p.earnings5yr !== null && p.credentialLevel === 3)
      .sort((a, b) => b.earnings5yr! - a.earnings5yr!)
      .slice(0, 10);
  }, [programs]);

  // ---------- Trends ----------
  const trendData = useMemo(() => {
    if (!history) return [];
    const years: number[] = [];
    for (let y = 2004; y <= 2023; y++) years.push(y);
    return years.map((y) => {
      const tuition = history.series.tuitionIn?.find((p) => p.year === y)?.value ?? null;
      const admit = history.series.admissionRate?.find((p) => p.year === y)?.value ?? null;
      const completion =
        history.series.completionRate?.find((p) => p.year === y)?.value ?? null;
      return {
        year: y,
        'In-state tuition': tuition,
        'Admit rate': admit === null ? null : admit * 100,
        'Completion rate': completion === null ? null : completion * 100,
      };
    });
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button
              onClick={onClose}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mb-2 no-print"
            >
              ← Back to filtered list
            </button>
            <h1 className="text-2xl font-semibold text-slate-900">{school.name}</h1>
            <div className="text-sm text-slate-500 mt-1">
              {school.city}, {school.state} ·{' '}
              <span className="text-slate-700">
                {OWNERSHIP_LABELS[school.ownership] ?? '—'}
              </span>
              {school.url && (
                <>
                  {' · '}
                  <a
                    href={
                      school.url.startsWith('http') ? school.url : `https://${school.url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {school.url} ↗
                  </a>
                </>
              )}
            </div>
          </div>
          <SchoolDetailActions
            school={school}
            isSelected={isSelected}
            onToggleSelect={onToggleSelect}
            copyShareLink={copyShareLink}
            copied={copied}
          />
        </div>
      </div>

      <SuppressionNote />

      {/* Headline stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigStat label="Enrollment" ctx={headline.size} format="num" />
        <BigStat label="Admit rate" tip="admit-rate" ctx={headline.admit} format="pct" />
        <BigStat label="Avg net price" tip="avg-net-price" ctx={headline.avgCost} format="money" lowerIsBetter />
        <BigStat label="4-yr completion" tip="completion-4yr-150" ctx={headline.completion} format="pct" />
        <BigStat label="Earnings (10y)" tip="earnings-10yr" ctx={headline.earnings} format="money" />
        <BigStat label="Median debt" tip="student-debt" ctx={headline.debt} format="money" lowerIsBetter />
        <BigStat label="3-yr default rate" tip="default-rate" ctx={headline.defaultRate} format="pct" lowerIsBetter />
        <BigStat label="1st-year retention" tip="first-year-retention" ctx={headline.retention} format="pct" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost & Aid */}
        <Section title="Cost & aid" subtitle="Net price after grants, by family income.">
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat label="In-state tuition" value={fmtMoney(school.tuitionIn)} />
            <Stat label="Out-of-state tuition" value={fmtMoney(school.tuitionOut)} />
            <Stat label="Avg net price" value={fmtMoney(school.avgCost)} />
            <Stat label="Pell %" value={fmtPct(school.pellGrantRate)} />
            <Stat label="Federal loan %" value={fmtPct(school.federalLoanRate)} />
            <Stat label="Median family income" value={fmtMoney(school.medianFamilyIncome)} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={netPriceData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : fmtMoney(Number(v)))}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Bar dataKey="Net price" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Admissions */}
        <Section
          title="Admissions"
          subtitle={
            school.testRequirements !== null
              ? `Test policy: ${TEST_POLICY_LABELS[school.testRequirements] ?? '—'}`
              : 'Test policy: not reported'
          }
        >
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat label="Admit rate" value={fmtPct(school.admissionRate)} />
            <Stat label="SAT 50th (R+M)" value={
              school.satRead50 !== null && school.satMath50 !== null
                ? `${school.satRead50 + school.satMath50}`
                : '—'
            } />
            <Stat label="SAT 25th–75th" value={
              school.satRead25 !== null && school.satMath25 !== null && school.satRead75 !== null && school.satMath75 !== null
                ? `${school.satRead25 + school.satMath25}–${school.satRead75 + school.satMath75}`
                : '—'
            } />
            <Stat label="ACT 50th" value={fmtNum(school.actCum50)} />
            <Stat label="ACT 25th–75th" value={
              school.actCum25 !== null && school.actCum75 !== null
                ? `${school.actCum25}–${school.actCum75}`
                : '—'
            } />
            <Stat label="Avg SAT" value={fmtNum(school.satAvg)} />
          </div>
        </Section>

        {/* Outcomes */}
        <Section
          title="Outcomes"
          subtitle="Earnings distribution 6 and 10 years after entry."
        >
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat label="Completion rate" value={fmtPct(school.completionRate)} />
            <Stat label="6-yr completion" value={fmtPct(school.titleIvCompleted6)} />
            <Stat label="Median earnings 6y" value={fmtMoney(school.earnings6MedianTrue)} />
            <Stat label="Median earnings 10y" value={fmtMoney(school.medianEarnings10)} />
            <Stat label="% earning > $25k" value={fmtPct(school.threshold10_25k)} />
            <Stat label="Earnings ÷ debt" value={
              school.medianEarnings10 !== null && school.medianDebt !== null && school.medianDebt > 0
                ? `${(school.medianEarnings10 / school.medianDebt).toFixed(2)}×`
                : '—'
            } />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={earningsDistData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : fmtMoney(Number(v)))}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="10th" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="25th" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Median" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="75th" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="90th" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Retention / cohort */}
        <Section
          title="Retention & cohort outcomes"
          subtitle="What happens to the entering Title-IV class within 6 years."
        >
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat label="1-yr retention (FT)" value={fmtPct(school.retentionFt4yr)} />
            <Stat label="Transfer-out rate" value={fmtPct(school.transferRate4yrFt)} />
            <Stat label="Withdrew (6y)" value={fmtPct(school.titleIvWithdrawn6)} />
            <Stat label="Still enrolled (6y)" value={fmtPct(school.titleIvStillEnrolled6)} />
          </div>
          {(school.titleIvCompleted6 !== null || school.titleIvWithdrawn6 !== null) && (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={cohortData}
                layout="vertical"
                margin={{ top: 8, right: 10, bottom: 8, left: 0 }}
              >
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                  formatter={(v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`)}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Completed" stackId="c" fill="#059669" />
                <Bar dataKey="Transf. completed" stackId="c" fill="#a7f3d0" />
                <Bar dataKey="Still enrolled" stackId="c" fill="#facc15" />
                <Bar dataKey="Withdrew" stackId="c" fill="#dc2626" />
                <Bar dataKey="Transf. withdrew" stackId="c" fill="#fca5a5" />
                <Bar dataKey="Unknown" stackId="c" fill="#cbd5e1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Demographics */}
        <Section
          title="Who attends"
          subtitle="Race / gender / age / Pell / first-gen."
        >
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat label="% women" value={fmtPct(school.genderWomen)} />
            <Stat label="% Pell" value={fmtPct(school.pellGrantRate)} />
            <Stat label="% first-gen" value={fmtPct(school.firstGen)} />
            <Stat label="% 25+" value={fmtPct(school.share25Older)} />
            <Stat label="% part-time" value={fmtPct(school.partTime)} />
            <Stat label="% veteran" value={fmtPct(school.veteran)} />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={studentRaceData}
              layout="vertical"
              margin={{ top: 8, right: 10, bottom: 8, left: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`)}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {RACE_GROUPS.map((g) => (
                <Bar key={g.label} dataKey={g.label} stackId="r" fill={g.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Faculty */}
        <Section
          title="Faculty"
          subtitle="Composition compared to the student body above."
        >
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat
              label="Student-faculty ratio"
              value={
                school.studentFacultyRatio === null
                  ? '—'
                  : `${school.studentFacultyRatio.toFixed(0)}:1`
              }
            />
            <Stat label="Faculty % women" value={fmtPct(school.facultyWomen)} />
            <Stat label="Faculty % white" value={fmtPct(school.facultyWhite)} />
            <Stat
              label="Diversity gap"
              value={
                school.raceWhite !== null && school.facultyWhite !== null
                  ? `${((school.facultyWhite - school.raceWhite) * 100).toFixed(0)} pp`
                  : '—'
              }
            />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={studentVsFaculty}
              layout="vertical"
              margin={{ top: 8, right: 10, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={60} />
              <Tooltip
                formatter={(v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`)}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {RACE_GROUPS.map((g, i) => (
                <Bar
                  key={g.label}
                  dataKey={g.label}
                  stackId="rf"
                  fill={i < FACULTY_RACE_GROUPS.length ? FACULTY_RACE_GROUPS[i].color : g.color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Programs */}
        <Section
          title="Top bachelor's programs"
          subtitle="Ranked by 5-year median earnings (when reported)."
          className="lg:col-span-2"
        >
          {progLoading ? (
            <div className="text-xs text-slate-500 py-4">Loading programs…</div>
          ) : topPrograms.length === 0 ? (
            <div className="text-xs text-slate-400 py-4">
              No bachelor's programs with reported earnings.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, topPrograms.length * 30)}>
              <BarChart
                data={topPrograms.map((p) => ({
                  label: p.title,
                  '5-yr earnings': p.earnings5yr,
                }))}
                layout="vertical"
                margin={{ top: 8, right: 30, bottom: 8, left: 8 }}
              >
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={10}
                  width={260}
                />
                <Tooltip
                  formatter={(v: number) => [fmtMoney(v), '5-yr earnings']}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Bar dataKey="5-yr earnings" fill="#6366f1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Trends */}
        <Section
          title="Trends over time"
          subtitle="In-state tuition, admit rate, and completion rate, 2004 → 2023."
          className="lg:col-span-2"
        >
          {histLoading ? (
            <div className="text-xs text-slate-500 py-4">Loading history…</div>
          ) : trendData.length === 0 ? (
            <div className="text-xs text-slate-400 py-4">No historical data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(v, name) => {
                    if (v === null || v === undefined) return '—';
                    if (name === 'In-state tuition') return fmtMoney(Number(v));
                    return `${Number(v).toFixed(1)}%`;
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="In-state tuition"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Admit rate"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Completion rate"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      <div className="text-center pt-4 no-print">
        <button
          onClick={onClose}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Back to filtered list
        </button>
      </div>

      {/* Visible only when printed — adds attribution + URL + timestamp */}
      <div className="print-only text-xs text-slate-500 pt-4 border-t border-slate-200">
        <div>
          <strong>{school.name}</strong> · {school.city}, {school.state} ·{' '}
          {OWNERSHIP_LABELS[school.ownership] ?? '—'}
        </div>
        <div className="mt-1">
          Source: U.S. Dept. of Education College Scorecard ·{' '}
          {typeof window !== 'undefined' ? window.location.href : ''} · printed{' '}
          {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

interface SchoolDetailActionsProps {
  school: School;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  copyShareLink: () => void;
  copied: boolean;
}

function SchoolDetailActions({
  school,
  isSelected,
  onToggleSelect,
  copyShareLink,
  copied,
}: SchoolDetailActionsProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  return (
    <div className="flex flex-wrap gap-2 no-print">
      {isLoggedIn && (
        <AddToStudentMenu schoolId={school.id} schoolName={school.name} />
      )}
      <button
        onClick={() => onToggleSelect(school.id)}
        className={`text-xs px-3 py-1.5 rounded-md border font-medium transition ${
          isSelected
            ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
        }`}
        title="Pinned schools appear in per-school breakdowns across every tab — Trends, Majors, Demographics, Faculty, Outcomes, Earnings, etc. Pick up to 5."
      >
        {isSelected ? '✓ Pinned' : '📌 Pin to dashboard'}
      </button>
      <button
        onClick={copyShareLink}
        className={`text-xs px-3 py-1.5 rounded-md border font-medium transition ${
          copied
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
        }`}
      >
        {copied ? '✓ Link copied' : '🔗 Share school'}
      </button>
      <button
        onClick={() => window.print()}
        className="text-xs px-3 py-1.5 rounded-md border font-medium transition bg-white border-slate-300 text-slate-700 hover:border-slate-400"
        title="Print this page or save it as PDF using your browser's print dialog"
      >
        🖨️ Print / save as PDF
      </button>
    </div>
  );
}

interface BigStatProps {
  label: string;
  ctx: ContextValue;
  format: 'money' | 'pct' | 'num';
  lowerIsBetter?: boolean;
  tip?: string;
}

function BigStat({ label, ctx, format, lowerIsBetter, tip }: BigStatProps) {
  const fmt = (v: number | null) => {
    if (v === null) return '—';
    if (format === 'money') return fmtMoney(v);
    if (format === 'pct') return fmtPct(v);
    return fmtNum(v);
  };

  const adjustedRank =
    ctx.pctRank === null ? null : lowerIsBetter ? 100 - ctx.pctRank : ctx.pctRank;

  let pctColor = 'text-slate-500';
  if (adjustedRank !== null) {
    if (adjustedRank >= 75) pctColor = 'text-emerald-700';
    else if (adjustedRank <= 25) pctColor = 'text-rose-700';
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
      <div className="text-xs text-slate-500 inline-flex items-center">
        {label}
        {tip && <InfoTooltip term={tip} />}
      </div>
      <div className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
        {fmt(ctx.value)}
      </div>
      <div className="text-[11px] mt-1 flex items-center gap-1">
        <span className="text-slate-400">vs filter median {fmt(ctx.filterMedian)}</span>
        {adjustedRank !== null && (
          <span
            className={`font-medium ${pctColor} inline-flex items-center`}
            title="How this school ranks vs others in the filter"
          >
            · P{adjustedRank}
            <InfoTooltip term="percentile-rank" />
          </span>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm p-4 ${className ?? ''}`}
    >
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 px-2.5 py-1.5 bg-slate-50/50">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}
