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
import { OWNERSHIP_LABELS, TEST_POLICY_LABELS } from '../api/scorecard';
import { fmtMoney, fmtNum, fmtPct } from '../util/format';
import { Accordion, AccordionSection } from '../components/Accordion';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Props {
  selectedSchools: School[];
}

const PALETTE = ['#6366f1', '#0ea5e9', '#059669', '#f59e0b', '#dc2626'];

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

function shortLabel(name: string, max = 22): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

interface MetricSpec {
  label: string;
  hint?: string;
  pick: (s: School) => string;
  /** If set, also returns a numeric magnitude for the inline mini-bar */
  bar?: (s: School) => number | null;
  /** Whether higher = better (for bar coloring); 'lower' = lower-is-better */
  direction?: 'higher' | 'lower';
}

interface SectionSpec {
  title: string;
  blurb: string;
  metrics: MetricSpec[];
}

const SECTIONS: SectionSpec[] = [
  {
    title: 'Cost & aid',
    blurb: 'What students typically pay and where their financial aid comes from.',
    metrics: [
      {
        label: 'In-state tuition',
        pick: (s) => fmtMoney(s.tuitionIn),
        bar: (s) => s.tuitionIn,
        direction: 'lower',
      },
      {
        label: 'Out-of-state tuition',
        pick: (s) => fmtMoney(s.tuitionOut),
        bar: (s) => s.tuitionOut,
        direction: 'lower',
      },
      {
        label: 'Avg net price',
        hint: 'Average sticker price minus typical grants and scholarships.',
        pick: (s) => fmtMoney(s.avgCost),
        bar: (s) => s.avgCost,
        direction: 'lower',
      },
      {
        label: 'Net price (income < $30k)',
        pick: (s) => fmtMoney(s.netPriceByIncome['0_30k']),
        bar: (s) => s.netPriceByIncome['0_30k'],
        direction: 'lower',
      },
      {
        label: 'Net price (income > $110k)',
        pick: (s) => fmtMoney(s.netPriceByIncome['110k_plus']),
        bar: (s) => s.netPriceByIncome['110k_plus'],
        direction: 'lower',
      },
      {
        label: '% on Pell grant',
        pick: (s) => fmtPct(s.pellGrantRate),
        bar: (s) => s.pellGrantRate,
      },
      {
        label: '% taking federal loans',
        pick: (s) => fmtPct(s.federalLoanRate),
        bar: (s) => s.federalLoanRate,
      },
    ],
  },
  {
    title: 'Admissions',
    blurb: 'How easy or hard it is to get in.',
    metrics: [
      {
        label: 'Admit rate',
        pick: (s) => fmtPct(s.admissionRate),
        bar: (s) => s.admissionRate,
        direction: 'lower',
      },
      {
        label: 'SAT 25th–75th (Reading + Math)',
        pick: (s) =>
          s.satRead25 !== null &&
          s.satMath25 !== null &&
          s.satRead75 !== null &&
          s.satMath75 !== null
            ? `${s.satRead25 + s.satMath25}–${s.satRead75 + s.satMath75}`
            : '—',
      },
      {
        label: 'ACT 25th–75th',
        pick: (s) =>
          s.actCum25 !== null && s.actCum75 !== null
            ? `${s.actCum25}–${s.actCum75}`
            : '—',
      },
      {
        label: 'Test policy',
        pick: (s) =>
          s.testRequirements === null
            ? '—'
            : TEST_POLICY_LABELS[s.testRequirements] ?? '—',
      },
    ],
  },
  {
    title: 'Outcomes',
    blurb: 'How students fare during and after their time on campus.',
    metrics: [
      {
        label: 'First-year retention',
        hint: 'Share of first-year students who came back for year two.',
        pick: (s) => fmtPct(s.retentionFt4yr ?? s.retentionFtLt4yr),
        bar: (s) => s.retentionFt4yr ?? s.retentionFtLt4yr,
      },
      {
        label: '4-yr completion (150% time)',
        pick: (s) => fmtPct(s.completionRate),
        bar: (s) => s.completionRate,
      },
      {
        label: '6-yr completion (Title-IV cohort)',
        pick: (s) => fmtPct(s.titleIvCompleted6),
        bar: (s) => s.titleIvCompleted6,
      },
      {
        label: 'Median earnings (6 yrs after entry)',
        pick: (s) => fmtMoney(s.earnings6MedianTrue),
        bar: (s) => s.earnings6MedianTrue,
      },
      {
        label: 'Median earnings (10 yrs after entry)',
        pick: (s) => fmtMoney(s.medianEarnings10),
        bar: (s) => s.medianEarnings10,
      },
      {
        label: '90th percentile earnings (10y)',
        pick: (s) => fmtMoney(s.earnings10P90),
        bar: (s) => s.earnings10P90,
      },
    ],
  },
  {
    title: 'Debt',
    blurb: 'What students borrow and how they fare paying it back.',
    metrics: [
      {
        label: 'Median student debt at graduation',
        pick: (s) => fmtMoney(s.medianDebt),
        bar: (s) => s.medianDebt,
        direction: 'lower',
      },
      {
        label: 'Median Parent PLUS debt',
        pick: (s) => fmtMoney(s.plusDebtAll),
        bar: (s) => s.plusDebtAll,
        direction: 'lower',
      },
      {
        label: '3-yr default rate',
        pick: (s) => fmtPct(s.defaultRate3yr),
        bar: (s) => s.defaultRate3yr,
        direction: 'lower',
      },
      {
        label: 'Earnings ÷ debt (10y)',
        hint: 'How many years of typical post-grad earnings would cover the typical debt balance.',
        pick: (s) =>
          s.medianEarnings10 !== null && s.medianDebt !== null && s.medianDebt > 0
            ? `${(s.medianEarnings10 / s.medianDebt).toFixed(2)}×`
            : '—',
      },
    ],
  },
  {
    title: 'Who attends',
    blurb: 'Student body composition.',
    metrics: [
      {
        label: 'Total enrollment',
        pick: (s) => fmtNum(s.size),
      },
      {
        label: '% women',
        pick: (s) => fmtPct(s.genderWomen),
        bar: (s) => s.genderWomen,
      },
      {
        label: '% first-generation',
        pick: (s) => fmtPct(s.firstGen),
        bar: (s) => s.firstGen,
      },
      {
        label: '% age 25 or older',
        pick: (s) => fmtPct(s.share25Older),
        bar: (s) => s.share25Older,
      },
      {
        label: 'Median family income',
        pick: (s) => fmtMoney(s.medianFamilyIncome),
        bar: (s) => s.medianFamilyIncome,
      },
      {
        label: 'Student-faculty ratio',
        pick: (s) =>
          s.studentFacultyRatio === null
            ? '—'
            : `${s.studentFacultyRatio.toFixed(0)}:1`,
        bar: (s) => s.studentFacultyRatio,
        direction: 'lower',
      },
    ],
  },
];

export function CompareTab({ selectedSchools }: Props) {
  const raceData = useMemo(() => {
    return selectedSchools.map((s) => {
      const row: Record<string, number | string> = { name: shortLabel(s.name, 18) };
      for (const g of RACE_GROUPS) {
        const v = s[g.key as keyof School] as number | null;
        row[g.label] = v === null ? 0 : v * 100;
      }
      return row;
    });
  }, [selectedSchools]);

  if (selectedSchools.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500">
        <div className="text-base font-medium text-slate-700 mb-1">
          Pin some schools to compare them
        </div>
        <div className="text-sm">
          Browse the dashboard, click a school name, and hit{' '}
          <span className="font-medium text-slate-700">📌 Pin to dashboard</span>.
          Then come back here for a side-by-side comparison sheet you can save or print.
        </div>
      </div>
    );
  }

  if (selectedSchools.length === 1) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500">
        <div className="text-base font-medium text-slate-700 mb-1">
          Pin at least one more school to start comparing
        </div>
        <div className="text-sm">
          You've pinned <span className="font-medium">{selectedSchools[0].name}</span>.
          Pin one to four more to see them side by side.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Comparing {selectedSchools.length} schools
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Print this page or save it as PDF using your browser's print dialog —
              chrome and tab nav drop out automatically.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="text-xs px-3 py-1.5 rounded-md border font-medium bg-white border-slate-300 text-slate-700 hover:border-slate-400 transition no-print"
            title="Print or save as PDF"
          >
            🖨️ Print / save as PDF
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {selectedSchools.map((s, i) => (
            <div
              key={s.id}
              className="border border-slate-200 rounded-md p-3 bg-slate-50/50"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <div className="font-semibold text-sm text-slate-800 leading-tight">
                  {s.name}
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {s.city}, {s.state}
              </div>
              <div className="text-xs text-slate-500">
                {OWNERSHIP_LABELS[s.ownership] ?? '—'}
                {s.size !== null && ` · ${fmtNum(s.size)} students`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <Accordion>
        {SECTIONS.map((sec) => (
          <AccordionSection
            key={sec.title}
            id={`compare.${slugify(sec.title)}`}
            title={sec.title}
            subtitle={sec.blurb}
          >
            <CompareSection section={sec} schools={selectedSchools} />
          </AccordionSection>
        ))}

        {/* Race composition (visual, not table) */}
        <AccordionSection
          id="compare.raceComposition"
          title="Student race / ethnicity composition"
          subtitle="Stacked share per school for direct comparison."
        >
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 print-keep">
        <h3 className="text-sm font-semibold text-slate-700">
          Student race / ethnicity composition
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Stacked share per school for direct comparison.
        </p>
        <ResponsiveContainer
          width="100%"
          height={Math.max(180, selectedSchools.length * 50)}
        >
          <BarChart
            data={raceData}
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
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              width={140}
            />
            <Tooltip
              formatter={(v) =>
                v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`
              }
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {RACE_GROUPS.map((g) => (
              <Bar key={g.label} dataKey={g.label} stackId="r" fill={g.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
        </AccordionSection>
      </Accordion>

      {/* Print footer */}
      <div className="print-only text-xs text-slate-500 pt-4 border-t border-slate-200">
        <div>
          Comparing:{' '}
          {selectedSchools.map((s) => s.name).join(' · ')}
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

function CompareSection({
  section,
  schools,
}: {
  section: SectionSpec;
  schools: School[];
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden print-keep">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">{section.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{section.blurb}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-1/3">Metric</th>
              {schools.map((s, i) => (
                <th key={s.id} className="px-3 py-2 text-left font-medium">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: PALETTE[i % PALETTE.length] }}
                    />
                    <span className="truncate" title={s.name}>
                      {shortLabel(s.name, 24)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {section.metrics.map((m, idx) => {
              const values = schools.map((s) => m.pick(s));
              const bars = m.bar ? schools.map((s) => m.bar!(s)) : null;
              const validBars = bars
                ? bars.filter((v): v is number => v !== null && v > 0)
                : [];
              const maxBar = validBars.length > 0 ? Math.max(...validBars) : 0;
              const minBar = validBars.length > 0 ? Math.min(...validBars) : 0;
              const direction: 'higher' | 'lower' = m.direction ?? 'higher';
              return (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-600 align-top">
                    {m.label}
                    {m.hint && (
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {m.hint}
                      </div>
                    )}
                  </td>
                  {schools.map((s, i) => {
                    const value = values[i];
                    const barVal = bars ? bars[i] : null;
                    const isBest =
                      barVal !== null &&
                      validBars.length > 1 &&
                      ((direction === 'higher' && barVal === maxBar) ||
                        (direction === 'lower' && barVal === minBar));
                    return (
                      <td key={s.id} className="px-3 py-2 align-top">
                        <div
                          className={`font-medium ${
                            isBest ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {value}
                          {isBest && (
                            <span
                              className="ml-1 text-[10px] text-emerald-700"
                              title={
                                direction === 'higher'
                                  ? 'Highest among compared'
                                  : 'Most favorable among compared'
                              }
                            >
                              ★
                            </span>
                          )}
                        </div>
                        {bars && barVal !== null && maxBar > 0 && (
                          <div className="mt-1 h-1 bg-slate-100 rounded overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${(barVal / maxBar) * 100}%`,
                                background: PALETTE[i % PALETTE.length],
                                opacity: 0.55,
                              }}
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
