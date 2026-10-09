import type { ReactNode } from 'react';
import { OWNERSHIP_LABELS } from '../api/scorecard';
import {
  highlights,
  schoolDescription,
  schoolOverview,
  sectionHeading,
  type PeerMedians,
  type PeerMetric,
  type SchoolFacts,
} from '../seo/schoolContent';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  facts: SchoolFacts;
  peers: PeerMedians;
  /** Top-left slot (e.g. "Back to filtered list"); omitted in static HTML. */
  back?: ReactNode;
  /** Top-right slot (pin / share / print); omitted in static HTML. */
  actions?: ReactNode;
  /** Extra line per metric card comparing with the dashboard filter; omitted in static HTML. */
  filterLine?: (metric: PeerMetric) => ReactNode;
  /** Extra cards appended to the glance grid (SPA-only metrics); omitted in static HTML. */
  extraStats?: ReactNode;
}

/**
 * Top of every school page: H1, description, key metrics and data overview.
 * Pure render (no hooks/effects) so scripts/generate-sitemap.ts can render it to
 * static HTML for crawlers with the exact markup the SPA shows.
 */
export function SchoolIntro({ facts, peers, back, actions, filterLine, extraStats }: Props) {
  const description = schoolDescription(facts);
  const overview = schoolOverview(facts, peers);
  const stats = highlights(facts, peers);
  const website = facts.url
    ? facts.url.startsWith('http')
      ? facts.url
      : `https://${facts.url}`
    : null;

  return (
    <>
      <header className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {back}
            <h1 className="text-2xl font-semibold text-slate-900">{facts.name}</h1>
            <div className="text-sm text-slate-500 mt-1">
              {facts.city}, {facts.state} ·{' '}
              <span className="text-slate-700">{OWNERSHIP_LABELS[facts.ownership] ?? 'n/a'}</span>
              {website && (
                <>
                  {' · '}
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {facts.url} ↗
                  </a>
                </>
              )}
            </div>
          </div>
          {actions}
        </div>
        {description.length > 0 && (
          <p className="mt-4 text-[15px] leading-relaxed text-slate-700 max-w-[72ch]">
            {description.join(' ')}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Source: U.S. Department of Education College Scorecard.
        </p>
      </header>

      {stats.length > 0 && (
        <section aria-labelledby="school-glance">
          <h2 id="school-glance" className="text-lg font-semibold text-slate-900 mb-3">
            {sectionHeading(facts.name, 'glance')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="text-xs text-slate-500 inline-flex items-center">
                  {s.label}
                  {s.tip && <InfoTooltip term={s.tip} />}
                </div>
                <div className="text-2xl font-semibold text-slate-900 mt-1">{s.value}</div>
                {s.peer && (
                  <div className="text-xs text-slate-400 mt-1">Similar schools: {s.peer}</div>
                )}
                {filterLine?.(s.metric)}
              </div>
            ))}
            {extraStats}
          </div>
        </section>
      )}

      {overview.length > 0 && (
        <section
          aria-labelledby="school-overview"
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-5"
        >
          <h2 id="school-overview" className="text-lg font-semibold text-slate-900">
            {sectionHeading(facts.name, 'overview')}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700 max-w-[72ch]">
            {overview.join(' ')}
          </p>
        </section>
      )}
    </>
  );
}
