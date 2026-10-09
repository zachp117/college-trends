import { useSession } from '../lib/auth-client';
import { AUTH_ENABLED } from '../util/featureFlags';
import { BrandLogo, Wordmark } from './Wordmark';

interface Props {
  onEnterApp: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onEnterApp, onSignIn }: Props) {
  // Only consult the auth session when the flag is on. When auth is hidden
  // we don't want a pending /api/auth/get-session request flickering UI.
  const { data: session, isPending } = useSession();
  const isLoggedIn = AUTH_ENABLED && !!session?.user;

  const primaryBtn =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors duration-200';
  const quietLink =
    'px-3 py-2 rounded-md text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200';

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">
            <Wordmark />
          </span>
          <div className="flex items-center gap-1">
            <a href="/about" className={`${quietLink} hidden sm:inline-block`}>
              About
            </a>
            {!AUTH_ENABLED ? (
              <button onClick={onEnterApp} className={`${primaryBtn} ml-2`}>
                Open dashboard →
              </button>
            ) : isPending ? null : isLoggedIn ? (
              <>
                <span className="hidden md:inline px-2 text-xs text-slate-400">
                  {session.user.email}
                </span>
                <button onClick={onEnterApp} className={`${primaryBtn} ml-2`}>
                  Open dashboard →
                </button>
              </>
            ) : (
              <>
                <button onClick={onSignIn} className={quietLink}>
                  Sign in
                </button>
                <button onClick={onSignIn} className={`${primaryBtn} ml-2`}>
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 items-end">
        <div className="md:col-span-7">
          <h1 className="text-[2.75rem] leading-[1.02] md:text-[4.25rem] md:leading-[0.98] font-semibold tracking-[-0.03em] text-slate-900">
            Compare any U.S. college on cost, earnings, and debt.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 max-w-[34rem]">
            College Trends puts the U.S. Department of Education's College Scorecard into one
            free, searchable dashboard. Students and parents can check what a school costs and how
            its graduates do. Researchers can filter, compare, and export every number.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-2">
            <button onClick={onEnterApp} className={`${primaryBtn} px-5 py-2.5`}>
              {isLoggedIn ? 'Open dashboard →' : 'Explore colleges →'}
            </button>
            <a href="#features" className={quietLink}>
              See what's inside ↓
            </a>
          </div>
        </div>

        {/* Index card: what's in the dataset */}
        <aside className="md:col-span-5 md:pl-6">
          <div className="relative rounded-xl bg-white/90 ring-1 ring-slate-200/80 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-900">What's in the data</span>
              <span className="text-xs font-medium text-amber-600">● Live data</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {DATASET_INDEX.map(([label, detail]) => (
                <li key={label} className="flex items-baseline gap-4 px-5 py-2.5">
                  <span className="text-sm font-medium text-slate-800">{label}</span>
                  <span className="ml-auto text-xs text-slate-400 text-right">{detail}</span>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500">
              Source: U.S. Dept. of Education College Scorecard
            </div>
          </div>
        </aside>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200/80 bg-white/60 scroll-mt-14">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-24">
              <h2 className="text-3xl font-semibold text-slate-900 leading-tight">
                Every angle on every school.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-500 max-w-xs">
                One dashboard over the federal College Scorecard, with the caveats left in.
              </p>
            </div>
          </div>
          <ol className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="py-6 border-t border-slate-200/80">
                <div className="font-num text-xs font-semibold text-indigo-500">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-2 text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Coming soon strip */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Coming soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-slate-200/80 rounded-xl overflow-hidden ring-1 ring-slate-200/80">
          {COMING_SOON.map(([title, body]) => (
            <div key={title} className="bg-white p-5">
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <div className="mt-1 text-sm leading-relaxed text-slate-500">{body}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          {/* Horizontal lockup; padding keeps the brand's clear space around the mark. */}
          <a href="/" className="p-3 -m-3 self-start hover:opacity-80 transition-opacity duration-150">
            <BrandLogo variant="lockup" colorway="ink" height={44} />
          </a>
          <div className="text-xs text-slate-400 space-y-2 md:text-right">
            <div>Data: U.S. Dept. of Education College Scorecard</div>
            <div className="flex flex-wrap gap-5 md:justify-end">
              <a href="/changelog" className="hover:text-slate-700 transition">
                What's new
              </a>
              <a href="/about" className="hover:text-slate-700 transition">
                About &amp; methodology
              </a>
              <a
                href="https://collegescorecard.ed.gov/data/api-documentation/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-700 transition"
              >
                API docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const DATASET_INDEX: [string, string][] = [
  ['Admissions', 'admit rates, SAT/ACT'],
  ['Cost & aid', 'net price by income'],
  ['Debt & repayment', 'balances, defaults'],
  ['Earnings', '6 & 10 yrs after entry'],
  ['Retention', 'year two, 6-yr completion'],
  ['Demographics', 'race, income, first-gen'],
  ['Faculty', 'race, gender'],
  ['Majors', 'earnings by program'],
];

const FEATURES: { title: string; body: string }[] = [
  {
    title: '13 views, one search',
    body: 'Cost, admissions, earnings, debt, retention, demographics, faculty, and majors for every school in the federal database. Browse by topic or by school.',
  },
  {
    title: 'A page for every school',
    body: 'Open any school to see all of its numbers in one place, with national percentiles that show where it stands.',
  },
  {
    title: 'Pin and compare',
    body: 'Pin up to 5 schools and see them side by side in every view: earnings ranges, graduation outcomes, and who attends.',
  },
  {
    title: 'Clear about the data',
    body: 'Plain-English definitions for every technical term. Notes wherever data is missing. You can always see what year a number comes from.',
  },
  {
    title: 'Easy to share',
    body: 'Every view has a shareable link. Export your filtered list to CSV in one click.',
  },
  {
    title: 'Free to use',
    body: 'The College Scorecard is public data, and College Trends is free for anyone to explore.',
  },
];

const COMING_SOON: [string, string][] = [
  ['Saved school lists', 'Keep a shortlist of schools and come back to it anytime.'],
  ['Reach, match, safety', 'Tag each school on your list by how likely you are to get in.'],
  ['Printable comparisons', 'A clean side-by-side sheet to print or share with family.'],
  ['Deadline tracker', "Every school's early decision, early action, and regular deadlines in one calendar."],
];
