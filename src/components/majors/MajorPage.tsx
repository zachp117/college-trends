import { useMemo, useState } from 'react';
import { ChartScatter, Table2 } from 'lucide-react';
import { MAJOR_PAGES } from '../../data/majors';
import {
  MAJOR_METRICS,
  familyName,
  majorIntro,
  majorPath,
  majorQuickFacts,
  summarizeMajor,
  type MajorInfo,
  type MajorRow,
} from '../../seo/majorContent';
import { int, stateName } from '../../seo/schoolContent';
import { InfoTooltip } from '../InfoTooltip';
import { SiteFooter, SiteHeader } from '../collections/SiteChrome';
import { MajorScatter } from './MajorScatter';
import { MajorTable } from './MajorTable';

interface Props {
  major: MajorInfo;
  rows: MajorRow[];
}

const card = 'bg-white rounded-lg border border-slate-200 shadow-sm';
const chip =
  'inline-block px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition';

const TYPES: Array<{ value: string; label: string; plural: string }> = [
  { value: '', label: 'All colleges', plural: 'all colleges' },
  { value: '1', label: 'Public', plural: 'public colleges' },
  { value: '2', label: 'Private nonprofit', plural: 'private nonprofit colleges' },
  { value: '3', label: 'Private for-profit', plural: 'private for-profit colleges' },
];

const selectCls =
  'text-sm text-slate-800 border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400';

/**
 * /majors/<slug>. Same markup in the SPA and the build-time static HTML; the
 * filters, chart and sorting come alive once React mounts.
 */
export function MajorPage({ major: m, rows }: Props) {
  const [type, setType] = useState('');
  const [state, setState] = useState('');

  const all = useMemo(() => summarizeMajor(rows), [rows]);
  const filtered = useMemo(
    () => rows.filter((r) => (!type || r.ownership === Number(type)) && (!state || r.state === state)),
    [rows, type, state],
  );
  const local = useMemo(() => summarizeMajor(filtered), [filtered]);
  const filtering = Boolean(type || state);
  const focusIds = useMemo(() => (filtering ? new Set(filtered.map((r) => r.id)) : null), [filtering, filtered]);
  const typeDef = TYPES.find((t) => t.value === type)!;
  const focusLabel = filtering
    ? `${typeDef.plural}${state ? ` in ${stateName(state)}` : ''}`
    : 'all colleges';

  const states = useMemo(
    () => [...new Set(rows.map((r) => r.state))].sort((a, b) => stateName(a).localeCompare(stateName(b))),
    [rows],
  );
  const intro = majorIntro(m, all);
  const facts = majorQuickFacts(m, rows, all);
  const related = MAJOR_PAGES.filter((o) => o.slug !== m.slug && o.cip.slice(0, 2) === m.cip.slice(0, 2));

  const stats: Array<{ label: string; value: string; sub?: string; tip?: string }> = [
    { label: 'Colleges', value: int(local.schools) },
    { label: 'Degrees awarded per year', value: int(local.graduates), tip: MAJOR_METRICS.awards.tip },
  ];
  for (const [k, label] of [
    ['e1', 'Median earnings, 1 yr'],
    ['e5', 'Median earnings, 5 yrs'],
    ['debt', 'Median debt'],
  ] as const) {
    const s = local[k];
    const n = all[k];
    stats.push({
      label,
      value: s ? MAJOR_METRICS[k].format(s.median) : 'n/a',
      sub: filtering && n ? `All colleges: ${MAJOR_METRICS[k].format(n.median)}` : s ? `${int(s.n)} reporting` : undefined,
      tip: `${MAJOR_METRICS[k].tip} The figure here is the median across institutions; branch campuses share their institution's figure and count once.`,
    });
  }

  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href={majorPath()} className="hover:text-slate-800">
                Majors
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-slate-700">{m.title}</li>
          </ol>
        </nav>

        <header className={`${card} p-5`}>
          <p className="text-xs text-slate-500">
            Bachelor's degree · {familyName(m.cip)} · CIP {m.cip.slice(0, 2)}.{m.cip.slice(2)}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1">
            {m.title}: earnings and debt by college
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700 max-w-[75ch]">{intro.join(' ')}</p>
          <p className="mt-3 text-xs text-slate-400">Source: U.S. Department of Education College Scorecard.</p>
        </header>

        <section aria-label="Filters" className="flex flex-wrap items-center gap-x-4 gap-y-2 no-print">
          <label className="text-xs text-slate-500 flex items-center gap-2">
            Colleges
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500 flex items-center gap-2">
            State
            <select value={state} onChange={(e) => setState(e.target.value)} className={selectCls}>
              <option value="">All states</option>
              {states.map((code) => (
                <option key={code} value={code}>
                  {stateName(code)}
                </option>
              ))}
            </select>
          </label>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setType('');
                setState('');
              }}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-medium"
            >
              Clear filters
            </button>
          )}
          <span className="text-xs text-slate-500">
            Showing {focusLabel}: {int(filtered.length)} of {int(rows.length)}.
          </span>
        </section>

        <section aria-label="Summary" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`${card} p-4`}>
              <div className="text-xs text-slate-500 inline-flex items-center">
                {s.label}
                {s.tip && <InfoTooltip text={s.tip} />}
              </div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{s.value}</div>
              {s.sub && <div className="text-xs text-slate-400 mt-1">{s.sub}</div>}
            </div>
          ))}
        </section>

        <section aria-labelledby="chart-heading" className={`${card} p-5`}>
          <h2 id="chart-heading" className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ChartScatter size={18} strokeWidth={1.75} className="text-slate-400" aria-hidden="true" />
            Compare {m.title} programs on one chart
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Pick any two measures. Hover a dot to see the college; click it to open the college's page.
          </p>
          <MajorScatter rows={rows} focusIds={focusIds} focusLabel={focusLabel} />
        </section>

        <section aria-labelledby="table-heading">
          <h2 id="table-heading" className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Table2 size={18} strokeWidth={1.75} className="text-slate-400" aria-hidden="true" />
            Colleges with a bachelor's in {m.title}
          </h2>
          <MajorTable rows={filtered} />
        </section>

        {facts.length > 0 && (
          <section aria-labelledby="facts-heading" className={`${card} p-5`}>
            <h2 id="facts-heading" className="text-lg font-semibold text-slate-900">
              Quick facts: {m.title}
            </h2>
            <dl className="mt-3 space-y-4 max-w-[75ch]">
              {facts.map((f) => (
                <div key={f.q}>
                  <dt className="text-[15px] font-medium text-slate-900">{f.q}</dt>
                  <dd className="text-[15px] leading-relaxed text-slate-700 mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section aria-labelledby="related-heading" className={`${card} p-5`}>
          <h2 id="related-heading" className="text-lg font-semibold text-slate-900">
            {related.length ? `Related majors in ${familyName(m.cip).toLowerCase()}` : 'More majors'}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((o) => (
              <li key={o.slug}>
                <a href={majorPath(o.slug)} className={chip}>
                  {o.title}
                </a>
              </li>
            ))}
            <li>
              <a href={majorPath()} className={chip}>
                All majors
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="method-heading" className="text-sm text-slate-600 max-w-[75ch]">
          <h2 id="method-heading" className="text-base font-semibold text-slate-900">
            How these numbers work
          </h2>
          <p className="mt-2 leading-relaxed">
            Figures cover bachelor's degree programs in {m.title} (CIP code {m.cip.slice(0, 2)}.{m.cip.slice(2)}), as
            reported in the College Scorecard. Earnings are medians for graduates who received federal aid, measured one
            and five years after they finished, among those working and not enrolled in school; the one-year and five-year
            figures describe different graduating classes. Debt is the median federal loan balance at graduation. The
            Scorecard withholds figures for programs with few graduates, so many smaller programs show n/a. Summary
            figures are medians across institutions: the Scorecard reports program earnings and debt for a whole
            institution, so branch campuses share one figure and count once. All figures are from the Scorecard's most
            recent field-of-study release.{' '}
            <a href="/about" className="text-indigo-700 hover:text-indigo-900 underline">
              More on the data
            </a>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
