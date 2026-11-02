import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { MAJOR_PAGES } from '../../data/majors';
import {
  MAJOR_METRICS,
  MIN_REPORTING,
  familyName,
  hubQuickFacts,
  majorPath,
  type MajorIndexEntry,
} from '../../seo/majorContent';
import { int } from '../../seo/schoolContent';
import { SiteFooter, SiteHeader } from '../collections/SiteChrome';

interface Props {
  /** Null while loading or when the data file is missing. */
  index: MajorIndexEntry[] | null;
}

type SortKey = 'title' | 'family' | 'schools' | 'e1' | 'e5' | 'debt';

const card = 'bg-white rounded-lg border border-slate-200 shadow-sm';

/** /majors: every bachelor's major with a page, sortable by earnings and debt. */
export function MajorsHub({ index }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('e5');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [query, setQuery] = useState('');

  // Without data, still list every major so the links work.
  const entries: MajorIndexEntry[] = useMemo(
    () =>
      index ??
      MAJOR_PAGES.map((m) => ({
        ...m,
        family: familyName(m.cip),
        schools: 0,
        graduates: 0,
        e1: null,
        e5: null,
        debt: null,
        n5: 0,
      })),
    [index],
  );

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? entries.filter((m) => m.title.toLowerCase().includes(q) || m.family.toLowerCase().includes(q))
      : [...entries];
    const sign = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === 'title' || sortKey === 'family') {
        return sign * a[sortKey].localeCompare(b[sortKey]) || a.title.localeCompare(b.title);
      }
      // Five-year medians from fewer than MIN_REPORTING colleges sort below the rest.
      if (sortKey === 'e5') {
        const at = a.n5 >= MIN_REPORTING ? 0 : 1;
        const bt = b.n5 >= MIN_REPORTING ? 0 : 1;
        if (at !== bt) return at - bt;
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return a.title.localeCompare(b.title);
      if (av === null) return 1;
      if (bv === null) return -1;
      return sign * (av - bv) || a.title.localeCompare(b.title);
    });
    return list;
  }, [entries, sortKey, dir, query]);

  const facts = index ? hubQuickFacts(index) : [];

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setDir(dir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setDir(k === 'title' || k === 'family' ? 'asc' : 'desc');
    }
  };

  const header = (k: SortKey, label: string, align: 'left' | 'right', title?: string) => (
    <th
      key={k}
      scope="col"
      className={`px-3 py-2 font-medium whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
      aria-sort={sortKey === k ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => sortBy(k)}
        title={title}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${sortKey === k ? 'text-slate-900' : ''}`}
      >
        {label}
        {sortKey === k &&
          (dir === 'asc' ? (
            <ArrowUp size={12} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ArrowDown size={12} strokeWidth={1.75} aria-hidden="true" />
          ))}
      </button>
    </th>
  );

  const money = (v: number | null) => (v === null ? <span className="text-slate-300">n/a</span> : MAJOR_METRICS.e5.format(v));

  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="max-w-[75ch]">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Earnings and debt by college major</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            How much bachelor's graduates earn one and five years after finishing, and how much they borrow, for{' '}
            {int(entries.length)} majors. Open any major to compare it across every college that offers it. All figures
            come from the U.S. Department of Education's College Scorecard.
          </p>
        </header>

        {facts.length > 0 && (
          <section aria-labelledby="hub-facts" className={`${card} p-5`}>
            <h2 id="hub-facts" className="text-lg font-semibold text-slate-900">
              Quick facts
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

        <section aria-labelledby="majors-table">
          <h2 id="majors-table" className="text-lg font-semibold text-slate-900 mb-3">
            All majors
          </h2>
          <div className="mb-3">
            <label className="sr-only" htmlFor="majors-filter">
              Filter majors
            </label>
            <input
              id="majors-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by major or field"
              className="w-full sm:w-72 text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {header('title', 'Major', 'left')}
                  {header('family', 'Field', 'left')}
                  {header('schools', 'Colleges', 'right')}
                  {header('e1', 'Earnings, 1 yr', 'right', MAJOR_METRICS.e1.tip)}
                  {header('e5', 'Earnings, 5 yrs', 'right', MAJOR_METRICS.e5.tip)}
                  {header('debt', 'Debt', 'right', MAJOR_METRICS.debt.tip)}
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => (
                  <tr key={m.slug} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-2 min-w-[14rem]">
                      <a href={majorPath(m.slug)} className="font-medium text-slate-900 hover:text-indigo-700">
                        {m.title}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-slate-500 min-w-[10rem]">{m.family}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{m.schools ? int(m.schools) : 'n/a'}</td>
                    <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">{money(m.e1)}</td>
                    <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">
                      {money(m.e5)}
                      {m.e5 !== null && m.n5 < MIN_REPORTING && (
                        <span className="text-slate-400" title={`Only ${m.n5} colleges report this`}>
                          {' '}
                          *
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">{money(m.debt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-[75ch]">
            Each figure is the median across institutions of that institution's median for the major. Branch campuses
            share their institution's figures and count once.
            Earnings cover graduates who received federal aid, working and not enrolled; one-year and five-year figures
            describe different graduating classes. Majors appear when at least {MIN_REPORTING} colleges report earnings;
            * marks a five-year figure from fewer than {MIN_REPORTING} colleges, sorted after the others.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
