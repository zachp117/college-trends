import { CHANGELOG } from '../data/changelog';
import type { ChangelogTag } from '../data/changelog';
import { DATA_UPDATES, OFFICIAL_CHANGELOG_URL, type DataUpdate } from '../data/dataUpdates';
import { FIELD_VINTAGES } from '../util/dataVintage';
import { Wordmark } from './Wordmark';

interface Props {
  onBack: () => void;
}

const TAG_STYLES: Record<ChangelogTag, string> = {
  New: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Improved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Fixed: 'bg-slate-100 text-slate-600 border-slate-200',
};

// Parse a YYYY-MM-DD string as a local date (avoids the UTC off-by-one
// you get from `new Date('2026-04-29')`).
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ChangelogPage({ onBack }: Props) {
  // Newest first; same-day entries keep their order in CHANGELOG.
  const entries = [...CHANGELOG].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-baseline justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-semibold">
            <Wordmark tone="light" />
          </h1>
          <button
            onClick={onBack}
            className="text-xs text-slate-300 hover:text-white underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900">What's New</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Recent updates to College Trends: new capabilities, improvements to
            what the tool can do, and major redesigns.
          </p>
        </div>

        <ol className="space-y-8">
          {entries.map((e) => (
            <li key={e.date + e.title} className="relative border-l-2 border-slate-200 pl-5">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-slate-50" />
              <div className="flex items-center gap-2 flex-wrap">
                <time className="text-xs font-medium text-slate-500 tabular-nums">
                  {formatDate(e.date)}
                </time>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${TAG_STYLES[e.tag]}`}
                >
                  {e.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-1.5">{e.title}</h3>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">{e.description}</p>
              {e.details && (
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-700 leading-relaxed">
                  {e.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>

        <DataUpdates />

        <footer className="border-t border-slate-200 mt-12 pt-6 text-xs text-slate-500">
          <button
            onClick={onBack}
            className="text-indigo-700 hover:text-indigo-900 font-medium"
          >
            ← Back to dashboard
          </button>
        </footer>
      </main>
    </div>
  );
}

const numFmt = new Intl.NumberFormat('en-US');

function schoolsPhrase(n: number): string {
  return `${numFmt.format(n)} ${n === 1 ? 'school' : 'schools'}`;
}

/** Record of College Scorecard data releases, kept by scripts/check-data-updates.ts. */
function DataUpdates() {
  return (
    <section aria-labelledby="data-updates" className="mt-14 pt-10 border-t border-slate-200">
      <h2 id="data-updates" className="text-2xl font-semibold text-slate-900">
        Data updates
      </h2>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        College Trends shows data from the U.S. Department of Education College Scorecard API,
        so new data appears on the site as soon as the Department publishes it. We check the API
        every day and record what changed here.
      </p>

      <div className="mt-6 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-900">Data years shown now</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          The Scorecard data file each group of figures comes from.
        </p>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {FIELD_VINTAGES.map((v) => (
            <div key={v.family} className="flex justify-between gap-4">
              <dt className="text-slate-600">{v.family}</dt>
              <dd className="font-medium text-slate-900 whitespace-nowrap">{v.year}</dd>
            </div>
          ))}
        </dl>
        {FIELD_VINTAGES.filter((v) => v.note).map((v) => (
          <p key={v.family} className="text-xs text-slate-500 mt-2">
            {v.note}.
          </p>
        ))}
      </div>

      {DATA_UPDATES.length > 0 && (
        <ol className="space-y-8 mt-8">
          {DATA_UPDATES.map((u) => (
            <DataUpdateItem key={u.date + (u.measured ? 'm' : 'h')} update={u} />
          ))}
        </ol>
      )}

      <p className="text-xs text-slate-500 mt-8">
        Source:{' '}
        <a
          href={OFFICIAL_CHANGELOG_URL}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-700 hover:text-indigo-900 underline"
        >
          College Scorecard change log
        </a>
        , U.S. Department of Education.
      </p>
    </section>
  );
}

function DataUpdateItem({ update: u }: { update: DataUpdate }) {
  const officialOnly = u.official && u.official.date === u.date;
  return (
    <li className="relative border-l-2 border-slate-200 pl-5">
      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-slate-400 ring-4 ring-slate-50" />
      <time className="text-xs font-medium text-slate-500">{formatDate(u.date)}</time>
      <h3 className="text-base font-semibold text-slate-900 mt-1.5">
        {u.measured ? 'Scorecard data updated' : 'Scorecard data release'}
      </h3>

      {u.measured && u.changes.length > 0 && (
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-700 leading-relaxed">
          {u.changes.map((c) => (
            <li key={c.family}>
              <span className="font-medium text-slate-900">{c.family}</span>: values changed for{' '}
              {schoolsPhrase(c.schools)}
              {c.year && c.previousYear && c.year !== c.previousYear
                ? `; now ${c.year} data (was ${c.previousYear})`
                : c.year
                  ? `; ${c.year} data`
                  : ''}
            </li>
          ))}
        </ul>
      )}
      {u.measured && (u.schoolsAdded > 0 || u.schoolsRemoved > 0) && (
        <p className="text-sm text-slate-700 mt-2">
          {[
            u.schoolsAdded > 0 && `${schoolsPhrase(u.schoolsAdded)} added`,
            u.schoolsRemoved > 0 && `${schoolsPhrase(u.schoolsRemoved)} no longer listed`,
          ]
            .filter(Boolean)
            .join('; ')}
          .
        </p>
      )}
      {u.measured && u.changes.length === 0 && u.schoolsAdded === 0 && u.schoolsRemoved === 0 && (
        <p className="text-sm text-slate-700 mt-1">
          The Department posted a release. The figures College Trends tracks had not changed yet.
        </p>
      )}

      {u.official && (
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {officialOnly ? '' : `Department of Education, ${formatDate(u.official.date)}: `}
          {u.official.summary}
        </p>
      )}
      {!u.measured && (
        <p className="text-xs text-slate-400 mt-1">
          From the Department's change log, before College Trends began tracking changes.
        </p>
      )}
    </li>
  );
}
