import { CHANGELOG } from '../data/changelog';
import type { ChangelogTag } from '../data/changelog';
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
  const entries = [...CHANGELOG].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-baseline justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-semibold">
            <Wordmark />
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
            Recent feature updates to College Trends — new capabilities and
            improvements to what the tool can do. Data refreshes and visual tweaks
            aren't listed here.
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
