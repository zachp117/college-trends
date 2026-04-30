import { useSession } from '../lib/auth-client';
import { AUTH_ENABLED } from '../util/featureFlags';

interface Props {
  onEnterApp: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onEnterApp, onSignIn }: Props) {
  // Only consult the auth session when the flag is on. When auth is hidden
  // we don't want a pending /api/auth/get-session request flickering UI.
  const { data: session, isPending } = useSession();
  const isLoggedIn = AUTH_ENABLED && !!session?.user;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">College Trends</div>
          <div className="flex items-center gap-3 text-sm">
            {!AUTH_ENABLED ? (
              <button
                onClick={onEnterApp}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded font-medium"
              >
                Open dashboard →
              </button>
            ) : isPending ? null : isLoggedIn ? (
              <>
                <span className="text-slate-300 text-xs">
                  Signed in as {session.user.email}
                </span>
                <button
                  onClick={onEnterApp}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded font-medium"
                >
                  Open dashboard →
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="px-3 py-1.5 hover:bg-slate-800 rounded"
                >
                  Sign in
                </button>
                <button
                  onClick={onSignIn}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded font-medium"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
          The data layer for college counselors.
        </h1>
        <p className="text-lg text-slate-600 mt-5 max-w-2xl mx-auto">
          Every U.S. college, every metric the federal government publishes — admissions,
          earnings, debt, completion, demographics — in one searchable dashboard. Built for
          counselors and families who need real numbers, not marketing pages.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={onEnterApp}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md"
          >
            {isLoggedIn ? 'Open dashboard →' : 'Try it free →'}
          </button>
          <a
            href="#features"
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-md border border-slate-300"
          >
            See what's inside
          </a>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          Powered by the U.S. Dept. of Education College Scorecard API.
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="11 dashboards, one search"
            body="Cost, selectivity, earnings, debt, retention, demographics, faculty, majors — every angle on every school in the federal database, navigable by tab or by school."
          />
          <FeatureCard
            title="Per-school deep dives"
            body="Click any school for a unified detail page that pulls together every metric, with national-percentile context so you know where it stands."
          />
          <FeatureCard
            title="Pin to dashboard"
            body="Track up to 5 schools at once. Their data shows up side-by-side in every tab — earnings ranges, cohort outcomes, racial breakdowns, the works."
          />
          <FeatureCard
            title="Honest about data"
            body="Plain-English glossary tooltips on every jargon term. Suppression notices where data is missing. Always know what year a number is from."
          />
          <FeatureCard
            title="Built for sharing"
            body="Every view has a shareable URL. Export your filtered set to CSV with one click. Counselor-branded reports coming soon."
          />
          <FeatureCard
            title="Free during beta"
            body="The data is public; your access is too. We'll add premium features for counseling agencies later. The core dashboard stays free."
          />
        </div>
      </section>

      {/* Coming soon strip */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="text-xs uppercase tracking-wide text-indigo-600 font-medium mb-2">
            Coming soon for counselors
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600">
            <div>
              <div className="font-medium text-slate-800">Per-student lists</div>
              <div className="text-xs">A roster of clients with a saved school list each.</div>
            </div>
            <div>
              <div className="font-medium text-slate-800">Reach / Match / Safety</div>
              <div className="text-xs">Tag every school per student. Auto-suggest based on profile.</div>
            </div>
            <div>
              <div className="font-medium text-slate-800">Branded PDF reports</div>
              <div className="text-xs">Hand families a polished comparison sheet with your logo.</div>
            </div>
            <div>
              <div className="font-medium text-slate-800">Deadline tracker</div>
              <div className="text-xs">Every school's ED1 / EA / RD dates in one calendar.</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-slate-400 text-center space-x-3">
        <a href="/about" className="underline hover:text-slate-600">
          About &amp; methodology
        </a>
        <span>·</span>
        <span>Data: U.S. Dept. of Education College Scorecard</span>
        <span>·</span>
        <a
          href="https://collegescorecard.ed.gov/data/api-documentation/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-slate-600"
        >
          API docs
        </a>
      </footer>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <div className="text-sm text-slate-600 mt-2 leading-relaxed">{body}</div>
    </div>
  );
}
