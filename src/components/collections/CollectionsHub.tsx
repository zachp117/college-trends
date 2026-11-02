import { ArrowRight } from 'lucide-react';
import { COLLECTIONS, COLLECTION_STATES, collectionPath } from '../../data/collections';
import { METRICS, type HubSummary } from '../../seo/collectionContent';
import { int, stateName } from '../../seo/schoolContent';
import { SiteFooter, SiteHeader } from './SiteChrome';

interface Props {
  /** Null while loading or when the data file is missing. */
  summary: HubSummary | null;
}

const chip =
  'inline-block px-2 py-0.5 rounded-md border border-slate-200 bg-white text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition';

/** /colleges: every collection, with links to its national and state pages. */
export function CollectionsHub({ summary }: Props) {
  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="max-w-[75ch]">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Compare U.S. colleges by type and state</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            Each page below puts a whole group of colleges on one chart and one table: cost, earnings, debt and
            graduation rates for every school, nationwide or within a state. All figures come from the U.S.
            Department of Education's College Scorecard.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {COLLECTIONS.map((c) => {
            const s = summary?.[c.slug];
            const states = [...(COLLECTION_STATES[c.slug] ?? [])].sort((a, b) =>
              stateName(a).localeCompare(stateName(b)),
            );
            return (
              <section
                key={c.slug}
                aria-labelledby={`hub-${c.slug}`}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col"
              >
                <h2 id={`hub-${c.slug}`} className="text-lg font-semibold text-slate-900">
                  <a href={collectionPath(c.slug)} className="hover:text-indigo-700">
                    {c.label}
                  </a>
                </h2>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{c.blurb}</p>
                {s && (
                  <dl className="grid grid-cols-3 gap-3 mt-4">
                    <div>
                      <dt className="text-xs text-slate-500">Schools</dt>
                      <dd className="text-lg font-semibold text-slate-900">{int(s.count)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Median net price</dt>
                      <dd className="text-lg font-semibold text-slate-900">
                        {s.netPrice === null ? 'n/a' : METRICS.netPrice.format(s.netPrice)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Median earnings, 10 yrs</dt>
                      <dd className="text-lg font-semibold text-slate-900">
                        {s.earnings10 === null ? 'n/a' : METRICS.earnings10.format(s.earnings10)}
                      </dd>
                    </div>
                  </dl>
                )}
                <a
                  href={collectionPath(c.slug)}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900"
                >
                  Compare {s ? `all ${int(s.count)}` : 'all'} {c.noun}
                  <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                </a>
                {states.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-medium text-slate-500">By state</h3>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {states.map((code) => (
                        <li key={code}>
                          <a href={collectionPath(c.slug, code)} className={chip}>
                            {stateName(code)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 max-w-[75ch]">
          Medians are across schools: each school counts once, whatever its size. For any individual school, open its
          page from the tables, or search every college in the{' '}
          <a href="/app" className="text-indigo-700 hover:text-indigo-900 underline">
            dashboard
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
