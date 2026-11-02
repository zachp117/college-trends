import { Wordmark } from '../Wordmark';

const navLink =
  'px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition';

/** Light sticky header for standalone content pages (the /colleges pages). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-slate-900">
          <Wordmark />
        </span>
        <nav className="flex items-center gap-1 text-sm">
          <a href="/colleges" className={`${navLink} hidden sm:inline-block`}>
            Browse colleges
          </a>
          <a href="/about" className={`${navLink} hidden sm:inline-block`}>
            About
          </a>
          <a
            href="/app"
            className="ml-1 px-3 py-1.5 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Open dashboard
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
      <span>Data: U.S. Dept. of Education College Scorecard · api.data.gov</span>
      <span className="flex gap-4">
        <a href="/colleges" className="hover:text-slate-700 transition">Browse colleges</a>
        <a href="/changelog" className="hover:text-slate-700 transition">What's new</a>
        <a href="/about" className="hover:text-slate-700 transition">About &amp; methodology</a>
      </span>
    </footer>
  );
}
