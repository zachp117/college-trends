import { useEffect } from 'react';
import { Wordmark } from './Wordmark';

interface Props {
  onGoHome: () => void;
  onGoApp: () => void;
}

export function NotFoundPage({ onGoHome, onGoApp }: Props) {
  // Reflect the URL the visitor actually tried, so they can see the typo.
  const attemptedPath =
    typeof window !== 'undefined' ? window.location.pathname : '';

  // Tell crawlers not to index this page (best-effort soft-404 mitigation
  // since static SPA hosting can't return a true HTTP 404).
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex');
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-lg sm:text-xl font-semibold">
            <Wordmark />
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl text-center">
          <div className="text-7xl sm:text-8xl font-bold text-indigo-600 leading-none">
            404
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-6">
            Page not found
          </h2>
          <p className="text-slate-600 mt-3 leading-relaxed">
            We can't find a page at{' '}
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm break-all">
              {attemptedPath}
            </code>
            . The link might be broken, or the URL might have a typo.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={onGoApp}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md"
            >
              Open dashboard →
            </button>
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-md border border-slate-300"
            >
              Back to homepage
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-10">
            Looking for a specific college? Use the search inside the dashboard
            — every U.S. college is in there.
          </p>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-6 text-xs text-slate-400 text-center">
        <a href="/about" className="underline hover:text-slate-600">
          About &amp; methodology
        </a>
      </footer>
    </div>
  );
}
