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

const RACE_GROUPS = [
  { studentKey: 'raceWhite', facultyKey: 'facultyWhite', label: 'White', color: '#3b82f6' },
  { studentKey: 'raceBlack', facultyKey: 'facultyBlack', label: 'Black', color: '#7c3aed' },
  {
    studentKey: 'raceHispanic',
    facultyKey: 'facultyHispanic',
    label: 'Hispanic',
    color: '#f59e0b',
  },
  { studentKey: 'raceAsian', facultyKey: 'facultyAsian', label: 'Asian', color: '#10b981' },
  { studentKey: 'raceAian', facultyKey: 'facultyAian', label: 'AIAN', color: '#dc2626' },
  { studentKey: 'raceNhpi', facultyKey: 'facultyNhpi', label: 'NHPI', color: '#ec4899' },
  {
    studentKey: 'raceTwoMore',
    facultyKey: 'facultyTwoMore',
    label: '2+ races',
    color: '#0ea5e9',
  },
  {
    studentKey: 'raceNonResident',
    facultyKey: 'facultyNonResident',
    label: 'Non-resident',
    color: '#64748b',
  },
  {
    studentKey: 'raceUnknown',
    facultyKey: 'facultyUnknown',
    label: 'Unknown',
    color: '#cbd5e1',
  },
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

function nonWhiteShare(s: School, side: 'student' | 'faculty'): number | null {
  const white = side === 'student' ? s.raceWhite : s.facultyWhite;
  if (white === null) return null;
  return 1 - white;
}

export function FacultyTab({ schools, selectedSchools }: Props) {
  // ----- Summary cards -----
  const summary = useMemo(() => {
    const ratios = schools
      .map((s) => s.studentFacultyRatio)
      .filter((v): v is number => v !== null);
    const facWomen = schools
      .map((s) => s.facultyWomen)
      .filter((v): v is number => v !== null);
    const facWhite = schools
      .map((s) => s.facultyWhite)
      .filter((v): v is number => v !== null);
    const studentNonWhite = schools
      .map((s) => nonWhiteShare(s, 'student'))
      .filter((v): v is number => v !== null);
    const facultyNonWhite = schools
      .map((s) => nonWhiteShare(s, 'faculty'))
      .filter((v): v is number => v !== null);
    return {
      medRatio: median(ratios),
      nRatio: ratios.length,
      medFacWomen: median(facWomen),
      nFacWomen: facWomen.length,
      medFacWhite: median(facWhite),
      nFacWhite: facWhite.length,
      medStudentNonWhite: median(studentNonWhite),
      medFacultyNonWhite: median(facultyNonWhite),
    };
  }, [schools]);

  // ----- Faculty race composition (selected + filter avg) -----
  const facultyRaceData = useMemo(() => {
    const rows: Array<Record<string, number | string | boolean>> = [];
    if (selectedSchools.length > 0) {
      for (const s of selectedSchools) {
        const row: Record<string, number | string | boolean> = {
          name: shortLabel(s.name),
        };
        for (const g of RACE_GROUPS) {
          const v = s[g.facultyKey as keyof School] as number | null;
          row[g.label] = v === null ? 0 : v * 100;
        }
        rows.push(row);
      }
    }
    const avgRow: Record<string, number | string | boolean> = {
      name: 'Avg across filter',
    };
    for (const g of RACE_GROUPS) {
      const vals = schools
        .map((s) => s[g.facultyKey as keyof School])
        .filter((v): v is number => typeof v === 'number');
      avgRow[g.label] = vals.length === 0 ? 0 : (vals.reduce((a, b) => a + b, 0) / vals.length) * 100;
    }
    rows.push(avgRow);
    return rows;
  }, [schools, selectedSchools]);

  // ----- Faculty gender (selected + avg) -----
  const facultyGenderData = useMemo(() => {
    const rows: Array<Record<string, number | string>> = [];
    if (selectedSchools.length > 0) {
      for (const s of selectedSchools) {
        rows.push({
          name: shortLabel(s.name),
          Men: (s.facultyMen ?? 0) * 100,
          Women: (s.facultyWomen ?? 0) * 100,
        });
      }
    }
    const men = schools.map((s) => s.facultyMen).filter((v): v is number => typeof v === 'number');
    const women = schools.map((s) => s.facultyWomen).filter((v): v is number => typeof v === 'number');
    rows.push({
      name: 'Avg across filter',
      Men: men.length === 0 ? 0 : (men.reduce((a, b) => a + b, 0) / men.length) * 100,
      Women: women.length === 0 ? 0 : (women.reduce((a, b) => a + b, 0) / women.length) * 100,
    });
    return rows;
  }, [schools, selectedSchools]);

  // ----- Student vs Faculty pair-bar comparison (per selected school) -----
  const sideBySideRows = useMemo(() => {
    if (selectedSchools.length === 0) return [];
    const out: Array<Record<string, number | string>> = [];
    for (const s of selectedSchools) {
      // For each school, two rows: students and faculty
      const studentRow: Record<string, number | string> = {
        name: `${shortLabel(s.name)} (students)`,
      };
      const facultyRow: Record<string, number | string> = {
        name: `${shortLabel(s.name)} (faculty)`,
      };
      for (const g of RACE_GROUPS) {
        const sv = s[g.studentKey as keyof School] as number | null;
        const fv = s[g.facultyKey as keyof School] as number | null;
        studentRow[g.label] = sv === null ? 0 : sv * 100;
        facultyRow[g.label] = fv === null ? 0 : fv * 100;
      }
      out.push(studentRow, facultyRow);
    }
    return out;
  }, [selectedSchools]);

  // ----- Student-faculty diversity scatter -----
  const diversityScatter = useMemo(() => {
    return schools
      .map((s) => {
        const sNW = nonWhiteShare(s, 'student');
        const fNW = nonWhiteShare(s, 'faculty');
        if (sNW === null || fNW === null) return null;
        return {
          x: sNW * 100,
          y: fNW * 100,
          name: s.name,
          size: s.size ?? 1000,
          ownership: s.ownership,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [schools]);

  const scatterByOwnership = useMemo(() => {
    const map = new Map<number, typeof diversityScatter>();
    for (const d of diversityScatter) {
      const arr = map.get(d.ownership) ?? [];
      arr.push(d);
      map.set(d.ownership, arr);
    }
    return map;
  }, [diversityScatter]);

  // ----- Top 50 by enrollment table -----
  const topRows = useMemo(() => {
    return [...schools]
      .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
      .slice(0, 50);
  }, [schools]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Student-faculty ratio"
          tip="student-faculty-ratio"
          value={
            summary.medRatio === null ? '—' : `${summary.medRatio.toFixed(0)}:1`
          }
          sub={`median across ${summary.nRatio.toLocaleString()} schools`}
        />
        <StatCard
          label="Faculty % women"
          value={fmtPct(summary.medFacWomen)}
          sub={`median across ${summary.nFacWomen.toLocaleString()} schools`}
        />
        <StatCard
          label="Faculty % white"
          value={fmtPct(summary.medFacWhite)}
          sub={`median across ${summary.nFacWhite.toLocaleString()} schools`}
        />
        <StatCard
          label="Student / faculty non-white"
          value={
            summary.medStudentNonWhite === null || summary.medFacultyNonWhite === null
              ? '—'
              : `${(summary.medStudentNonWhite * 100).toFixed(0)}% / ${(summary.medFacultyNonWhite * 100).toFixed(0)}%`
          }
          sub="median across filter"
        />
      </div>

      <Accordion>
        {/* Student vs Faculty side-by-side */}
        <AccordionSection id="faculty.studentVsFaculty" title="Student vs. faculty composition — selected schools">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Student vs. faculty composition — selected schools
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            For each selected school, paired stacked bars: who's enrolled vs. who's teaching.
          </p>
          {sideBySideRows.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
              Pin schools (📌) from the table below to compare student and faculty composition.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, sideBySideRows.length * 42)}
            >
              <BarChart
                data={sideBySideRows}
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
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={210} />
                <Tooltip
                  formatter={(v) =>
                    v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`
                  }
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {RACE_GROUPS.map((g) => (
                  <Bar key={g.label} dataKey={g.label} stackId="race" fill={g.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        </AccordionSection>

        {/* Faculty race composition */}
        <AccordionSection id="faculty.racialMakeup" title="Faculty race / ethnicity">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Faculty race / ethnicity
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {selectedSchools.length > 0
              ? 'Per selected school + filter average.'
              : 'Average composition across the filter.'}
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(180, facultyRaceData.length * 50)}
          >
            <BarChart
              data={facultyRaceData}
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
                formatter={(v) =>
                  v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`
                }
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {RACE_GROUPS.map((g) => (
                <Bar key={g.label} dataKey={g.label} stackId="race" fill={g.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        </AccordionSection>

        {/* Faculty gender */}
        <AccordionSection id="faculty.genderSplit" title="Faculty gender split">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Faculty gender split</h3>
          <p className="text-xs text-slate-500 mb-3">
            {selectedSchools.length > 0
              ? 'Per selected school + filter average.'
              : 'Average across the filter.'}
          </p>
          <ResponsiveContainer
            width="100%"
            height={Math.max(180, facultyGenderData.length * 50)}
          >
            <BarChart
              data={facultyGenderData}
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
                formatter={(v) =>
                  v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`
                }
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Men" stackId="gender" fill="#3b82f6" />
              <Bar dataKey="Women" stackId="gender" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </AccordionSection>

        {/* Student vs faculty diversity scatter */}
        <AccordionSection id="faculty.diversityScatter" title="Student vs. faculty: % non-white (across filter)">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Student vs. faculty: % non-white (across filter)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Each dot = a school. Dashed line = parity. Schools below the line have a more diverse
            student body than faculty (the typical pattern). Bubble size = enrollment.
          </p>
          {diversityScatter.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              No schools report both student and faculty race composition.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Students % non-white"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Faculty % non-white"
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
                        <div>Students non-white: {d.x.toFixed(1)}%</div>
                        <div>Faculty non-white: {d.y.toFixed(1)}%</div>
                        <div>Gap: {(d.x - d.y).toFixed(1)} pp</div>
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

      {/* Top 50 table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">
            Faculty composition — top 50 by enrollment
          </h3>
        </div>
        <div className="max-h-[440px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {[
                  'School',
                  'S:F ratio',
                  '% women',
                  '% white',
                  '% Black',
                  '% Hisp.',
                  '% Asian',
                  'Faculty non-white',
                  'Student non-white',
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
              {topRows.map((s) => {
                const sNW = nonWhiteShare(s, 'student');
                const fNW = nonWhiteShare(s, 'faculty');
                const gap = sNW !== null && fNW !== null ? sNW - fNW : null;
                return (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {s.studentFacultyRatio === null
                        ? '—'
                        : `${s.studentFacultyRatio.toFixed(0)}:1`}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.facultyWomen)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.facultyWhite)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.facultyBlack)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.facultyHispanic)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(s.facultyAsian)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtPct(fNW)}</td>
                    <td
                      className={`px-3 py-2 tabular-nums ${
                        gap === null
                          ? ''
                          : gap > 0.15
                            ? 'text-rose-700'
                            : gap > 0.05
                              ? 'text-amber-700'
                              : ''
                      }`}
                    >
                      {fmtPct(sNW)}
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

