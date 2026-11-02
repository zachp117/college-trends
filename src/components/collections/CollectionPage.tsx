import { ChartScatter, LayoutDashboard, Table2 } from 'lucide-react';
import {
  COLLECTIONS,
  collectionPath,
  hasStatePage,
  COLLECTION_STATES,
  type Collection,
} from '../../data/collections';
import vintages from '../../data/dataVintages.json';
import {
  METRICS,
  byState,
  collectionIntro,
  metricsFor,
  quickFacts,
  summarize,
  type CollectionRow,
  type Place,
  type RowMetric,
  type Summary,
} from '../../seo/collectionContent';
import { int, stateName } from '../../seo/schoolContent';
import { InfoTooltip } from '../InfoTooltip';
import { CollectionScatter } from './CollectionScatter';
import { CollectionTable } from './CollectionTable';
import { SiteFooter, SiteHeader } from './SiteChrome';

interface Props {
  collection: Collection;
  state: Place | null;
  /** Every school in the collection, nationwide. */
  rows: CollectionRow[];
}

const card = 'bg-white rounded-lg border border-slate-200 shadow-sm';

const STAT_LABELS: Array<[RowMetric, string]> = [
  ['netPrice', 'Median net price'],
  ['earnings10', 'Median earnings, 10 yrs'],
  ['medianDebt', 'Median debt'],
  ['gradRate', 'Median grad rate'],
];

function dashboardHref(c: Collection, state: Place | null): string | null {
  if (!c.dashboard) return null;
  const p = new URLSearchParams();
  if (state) p.set('state', state.code);
  p.set('ownership', c.dashboard.ownership.join(','));
  p.set('degreeLevels', c.dashboard.degreeLevels.join(','));
  return `/app?${p.toString()}`;
}

/**
 * /colleges/<collection>[/<state>]. Renders the same markup in the SPA and in the
 * build-time static HTML (scripts/generate-sitemap.ts); the chart and table sorting
 * come alive once React mounts.
 */
export function CollectionPage({ collection: c, state, rows }: Props) {
  const local = state ? rows.filter((r) => r.state === state.code) : rows;
  const localSummary = summarize(local);
  const nationalSummary = state ? summarize(rows) : null;
  const where = state ? state.name : 'the United States';
  const intro = collectionIntro(c, state, localSummary, nationalSummary);
  const facts = quickFacts(c, state, local, localSummary);
  const metrics = metricsFor(c);
  const dash = dashboardHref(c, state);
  const statesWithPages = COLLECTION_STATES[c.slug] ?? [];
  const otherTypesHere = state
    ? COLLECTIONS.filter((o) => o.slug !== c.slug && hasStatePage(o.slug, state.code))
    : [];

  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href={collectionPath()} className="hover:text-slate-800">
                Colleges
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              {state ? (
                <a href={collectionPath(c.slug)} className="hover:text-slate-800">
                  {c.label}
                </a>
              ) : (
                <span className="text-slate-700">{c.label}</span>
              )}
            </li>
            {state && (
              <>
                <li aria-hidden="true">/</li>
                <li className="text-slate-700">{state.name}</li>
              </>
            )}
          </ol>
        </nav>

        <header className={`${card} p-5`}>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            {c.label} in {where}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700 max-w-[75ch]">{intro.join(' ')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {dash && (
              <a
                href={dash}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                <LayoutDashboard size={15} strokeWidth={1.75} aria-hidden="true" />
                Open in the dashboard
              </a>
            )}
            <span className="text-xs text-slate-400">Source: U.S. Department of Education College Scorecard.</span>
          </div>
        </header>

        <StatGrid local={localSummary} national={nationalSummary} />

        <section aria-labelledby="chart-heading" className={`${card} p-5`}>
          <h2 id="chart-heading" className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ChartScatter size={18} strokeWidth={1.75} className="text-slate-400" aria-hidden="true" />
            Compare all {c.noun} in {where} on one chart
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Pick any two measures. Hover a dot to see the school; click it to open the school's page.
          </p>
          <CollectionScatter
            rows={rows}
            stateCode={state?.code ?? null}
            stateName={state?.name ?? null}
            noun={c.noun}
            options={metrics}
          />
        </section>

        <section aria-labelledby="table-heading">
          <h2 id="table-heading" className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Table2 size={18} strokeWidth={1.75} className="text-slate-400" aria-hidden="true" />
            All {int(local.length)} {c.noun} in {where}
          </h2>
          <CollectionTable rows={local} metrics={metrics} showState={!state} noun={c.noun} />
        </section>

        {!state && <StateTable collection={c} rows={rows} />}

        {facts.length > 0 && (
          <section aria-labelledby="facts-heading" className={`${card} p-5`}>
            <h2 id="facts-heading" className="text-lg font-semibold text-slate-900">
              Quick facts: {c.noun} in {where}
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

        {state && (
          <section aria-labelledby="more-heading" className={`${card} p-5 space-y-4`}>
            <h2 id="more-heading" className="text-lg font-semibold text-slate-900">
              Keep comparing
            </h2>
            {otherTypesHere.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700">Other college types in {state.name}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {otherTypesHere.map((o) => (
                    <li key={o.slug}>
                      <a href={collectionPath(o.slug, state.code)} className={chip}>
                        {o.label} in {state.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-700">{c.label} in other states</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                <li>
                  <a href={collectionPath(c.slug)} className={chip}>
                    All U.S. {c.noun}
                  </a>
                </li>
                {statesWithPages
                  .filter((code) => code !== state.code)
                  .sort((a, b) => stateName(a).localeCompare(stateName(b)))
                  .map((code) => (
                    <li key={code}>
                      <a href={collectionPath(c.slug, code)} className={chip}>
                        {stateName(code)}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </section>
        )}

        <section aria-labelledby="method-heading" className="text-sm text-slate-600 max-w-[75ch]">
          <h2 id="method-heading" className="text-base font-semibold text-slate-900">
            How these numbers work
          </h2>
          <p className="mt-2 leading-relaxed">
            This page includes {c.definition}, as reported in the College Scorecard. Summary figures are medians
            across schools: each school counts once, whatever its size, and schools that don't report a measure are
            left out of that measure. The Scorecard reports earnings and debt for a whole institution, so branch
            campuses share one figure; for those two measures each institution counts once. Most recent data year: cost {vintages.years.cost}, graduation and retention{' '}
            {vintages.years.completion}, earnings {vintages.years.earnings}, debt {vintages.years.debt}.{' '}
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

const chip =
  'inline-block px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition';

function StatGrid({ local, national }: { local: Summary; national: Summary | null }) {
  const cards: Array<{ label: string; value: string; sub?: string; tip?: string }> = [
    { label: 'Schools', value: int(local.count) },
    { label: 'Undergraduates', value: int(local.students), tip: METRICS.size.tip },
  ];
  for (const [k, label] of STAT_LABELS) {
    const s = local.metrics[k];
    if (!s) continue;
    const n = national?.metrics[k];
    cards.push({
      label,
      value: METRICS[k].format(s.median),
      sub: n ? `U.S.: ${METRICS[k].format(n.median)}` : `${int(s.n)} reporting`,
      tip: `${METRICS[k].tip} The figure here is the median across ${
        k === 'earnings10' || k === 'medianDebt' ? 'institutions (branch campuses count once)' : 'schools'
      }.`,
    });
  }
  return (
    <section aria-label="Summary" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((s) => (
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
  );
}

function StateTable({ collection: c, rows }: { collection: Collection; rows: CollectionRow[] }) {
  const states = byState(c, rows);
  const cols: RowMetric[] = ['netPrice', 'earnings10', 'gradRate'];
  return (
    <section aria-labelledby="states-heading">
      <h2 id="states-heading" className="text-lg font-semibold text-slate-900 mb-3">
        {c.label} by state
      </h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">State</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Schools</th>
              {cols.map((k) => (
                <th key={k} scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  Median {METRICS[k].short.toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map((s) => (
              <tr key={s.code} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  {s.hasPage ? (
                    <a href={collectionPath(c.slug, s.code)} className="font-medium text-slate-900 hover:text-indigo-700">
                      {s.name}
                    </a>
                  ) : (
                    <span className="text-slate-700">{s.name}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-slate-700">{int(s.count)}</td>
                {cols.map((k) => {
                  const m = s.summary.metrics[k];
                  return (
                    <td key={k} className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">
                      {m ? METRICS[k].format(m.median) : <span className="text-slate-300">n/a</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Medians across each state's schools. States with fewer than 3 {c.noun} don't get their own page.
      </p>
    </section>
  );
}
