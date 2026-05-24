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
import { OWNERSHIP_LABELS } from '../api/scorecard';
import { fmtMoney, fmtNum, fmtPct } from '../util/format';
import { StatCard } from '../components/StatCard';
import { Accordion, AccordionSection } from '../components/Accordion';

interface Props {
  schools: School[];
  selectedSchools: School[];
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

export function DemographicsTab({ schools, selectedSchools }: Props) {
  // ----- Summary stat cards (medians across filter) -----
  const summary = useMemo(() => {
    const pick = (key: keyof School) =>
      schools.map((s) => s[key]).filter((v): v is number => typeof v === 'number');
    return {
      pell: median(pick('pellGrantRate')),
      firstGen: median(pick('firstGen')),
      partTime: median(pick('partTime')),
      over25: median(pick('share25Older')),
      veteran: median(pick('veteran')),
      familyInc: median(pick('medianFamilyIncome')),
      ageEntry: median(pick('ageEntry')),
      studentFaculty: median(pick('studentFacultyRatio')),
    };
  }, [schools]);

  // ----- Pell × first-gen scatter (across all filtered) -----
  const scatterData = useMemo(() => {
    return schools
      .filter((s) => s.pellGrantRate !== null && s.firstGen !== null)
      .map((s) => ({
        x: s.pellGrantRate! * 100,
        y: s.firstGen! * 100,
        size: s.size ?? 1000,
        ownership: s.ownership,
        name: s.name,
        completionRate: s.completionRate,
      }));
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

  // ----- Family income histogram (across filter) -----
  const incomeBuckets = useMemo(() => {
    const buckets = [
      { label: '<$30k', lo: 0, hi: 30000, count: 0 },
      { label: '$30–50k', lo: 30000, hi: 50000, count: 0 },
      { label: '$50–75k', lo: 50000, hi: 75000, count: 0 },
      { label: '$75–100k', lo: 75000, hi: 100000, count: 0 },
      { label: '$100–150k', lo: 100000, hi: 150000, count: 0 },
      { label: '$150k+', lo: 150000, hi: Infinity, count: 0 },
    ];
    let withData = 0;
    for (const s of schools) {
      if (s.medianFamilyIncome === null) continue;
      withData++;
      const b = buckets.find((x) => s.medianFamilyIncome! >= x.lo && s.medianFamilyIncome! < x.hi);
      if (b) b.count++;
    }
    return { buckets, withData };
  }, [schools]);

  // ----- Race composition (per selected school + average reference) -----
  const raceCompositionData = useMemo(() => {
    const set: Array<{ name: string; isAvg: boolean } & Record<string, number | string | boolean>> = [];

    if (selectedSchools.length > 0) {
      for (const s of selectedSchools) {
        const row: Record<string, number | string | boolean> = {
          name: s.name,
          isAvg: false,
        };
        for (const g of RACE_GROUPS) {
          const v = s[g.key as keyof School] as number | null;
          row[g.label] = v === null ? 0 : v * 100;
        }
        set.push(row as typeof set[number]);
      }
    }

    // Compute average for the filter set as a reference bar
    const avgRow: Record<string, number | string | boolean> = {
      name: 'Avg across filter',
      isAvg: true,
    };
    for (const g of RACE_GROUPS) {
      const vals = schools
        .map((s) => s[g.key as keyof School])
        .filter((v): v is number => typeof v === 'number');
      avgRow[g.label] = vals.length === 0 ? 0 : (vals.reduce((a, b) => a + b, 0) / vals.length) * 100;
    }
    set.push(avgRow as typeof set[number]);
    return set;
  }, [schools, selectedSchools]);

  // ----- Gender split (per selected school + average) -----
  const genderData = useMemo(() => {
    const rows: Array<Record<string, number | string>> = [];
    if (selectedSchools.length > 0) {
      for (const s of selectedSchools) {
        rows.push({
          name: s.name,
          Men: (s.genderMen ?? 0) * 100,
          Women: (s.genderWomen ?? 0) * 100,
        });
      }
    }
    const men = schools.map((s) => s.genderMen).filter((v): v is number => typeof v === 'number');
    const women = schools.map((s) => s.genderWomen).filter((v): v is number => typeof v === 'number');
    rows.push({
      name: 'Avg across filter',
      Men: men.length === 0 ? 0 : (men.reduce((a, b) => a + b, 0) / men.length) * 100,
      Women: women.length === 0 ? 0 : (women.reduce((a, b) => a + b, 0) / women.length) * 100,
    });
    return rows;
  }, [schools, selectedSchools]);

  return (
    <Accordion>
      <AccordionSection id="demographics.summary" title="Demographics summary">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pell recipients" tip="pell-rate" value={fmtPct(summary.pell)} sub="median across filter" />
        <StatCard label="First-generation" tip="first-generation" value={fmtPct(summary.firstGen)} sub="median across filter" />
        <StatCard label="Part-time" value={fmtPct(summary.partTime)} sub="median across filter" />
        <StatCard label="25 & older" tip="25-and-older" value={fmtPct(summary.over25)} sub="median across filter" />
        <StatCard
          label="Median family income"
          value={fmtMoney(summary.familyInc)}
          sub="median across filter"
        />
        <StatCard label="Veterans" value={fmtPct(summary.veteran)} sub="median across filter" />
        <StatCard
          label="Avg age at entry"
          value={summary.ageEntry === null ? '—' : `${summary.ageEntry.toFixed(1)} yrs`}
          sub="median across filter"
        />
        <StatCard
          label="Student-faculty ratio"
          tip="student-faculty-ratio"
          value={
            summary.studentFaculty === null
              ? '—'
              : `${summary.studentFaculty.toFixed(0)}:1`
          }
          sub="median across filter"
        />
      </div>
      </AccordionSection>

      {/* Race composition */}
      <AccordionSection id="demographics.raceBreakdown" title="Race / ethnicity composition">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Race / ethnicity composition
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {selectedSchools.length > 0
              ? `Stacked share per selected school, plus average across the filter as reference.`
              : 'Average composition across the filter. Select schools to see them stacked individually.'}
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(180, raceCompositionData.length * 60)}
          >
            <BarChart
              data={raceCompositionData}
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
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={140} />
              <Tooltip
                formatter={(v: number) => `${v.toFixed(1)}%`}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {RACE_GROUPS.map((g) => (
                <Bar key={g.key} dataKey={g.label} stackId="race" fill={g.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AccordionSection>

      {/* Gender split */}
      <AccordionSection id="demographics.genderSplit" title="Gender split">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Gender split</h3>
          <p className="text-xs text-slate-500 mb-3">
            {selectedSchools.length > 0
              ? 'Per selected school + average across the filter.'
              : 'Average across the filter. Pin schools (📌) to compare.'}
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(180, genderData.length * 60)}
          >
            <BarChart
              data={genderData}
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
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={140} />
              <Tooltip
                formatter={(v: number) => `${v.toFixed(1)}%`}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Men" stackId="gender" fill="#3b82f6" />
              <Bar dataKey="Women" stackId="gender" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AccordionSection>

      {/* Pell × first-gen scatter */}
      <AccordionSection
        id="demographics.pellFirstGen"
        title="Pell recipients vs. first-generation share"
      >
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Pell recipients vs. first-generation share
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Each dot = a school. Bubble size = enrollment, color = ownership type.
          </p>
          {scatterData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              No schools with both Pell and first-gen data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Pell %"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  domain={[0, 100]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="First-gen %"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  domain={[0, 100]}
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
                      completionRate: number | null;
                    };
                    return (
                      <div className="bg-white border border-slate-200 rounded p-2 text-xs shadow">
                        <div className="font-medium">{d.name}</div>
                        <div>Pell: {d.x.toFixed(1)}%</div>
                        <div>First-gen: {d.y.toFixed(1)}%</div>
                        <div>Size: {d.size.toLocaleString()}</div>
                        <div>Completion: {fmtPct(d.completionRate)}</div>
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
      </AccordionSection>

      {/* Family income histogram */}
      <AccordionSection
        id="demographics.familyIncome"
        title="Median family income — distribution"
      >
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Median family income — distribution
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Median family income reported across {incomeBuckets.withData.toLocaleString()}{' '}
            schools.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={incomeBuckets.buckets}
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
                {incomeBuckets.buckets.map((_b, i) => (
                  <Cell
                    key={i}
                    fill={`rgb(${Math.round(99 + i * 22)},${Math.round(102 + i * 18)},${Math.round(241 - i * 12)})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AccordionSection>

      {/* Demographics table */}
      <AccordionSection
        id="demographics.topSchoolsTable"
        title="Demographics — top 50 schools by enrollment"
      >
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="max-h-[480px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {[
                  'School',
                  'Size',
                  'Pell',
                  '1st-gen',
                  'Part-time',
                  '25+',
                  'Vet.',
                  '% Women',
                  'Med. fam. inc.',
                  'S:F ratio',
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
                .map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtNum(s.size)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.pellGrantRate)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.firstGen)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.partTime)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.share25Older)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.veteran)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.genderWomen)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(s.medianFamilyIncome)}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {s.studentFacultyRatio === null
                        ? '—'
                        : `${s.studentFacultyRatio.toFixed(0)}:1`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      </AccordionSection>
    </Accordion>
  );
}

