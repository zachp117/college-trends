import { FIELD_VINTAGES } from '../util/dataVintage';

interface Props {
  onBack: () => void;
}

export function AboutPage({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-baseline justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-semibold">
            <a href="/" className="hover:text-slate-200">
              College Trends
            </a>
          </h1>
          <button
            onClick={onBack}
            className="text-xs text-slate-300 hover:text-white underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Mission */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">About this tool</h2>
          <p className="text-base text-slate-700 mt-3 leading-relaxed">
            College Trends is a free, public dashboard that turns the U.S.
            Department of Education's <em>College Scorecard</em> dataset into something
            anyone can actually use — students and families weighing their options,
            counselors advising them, and journalists or researchers covering higher
            education.
          </p>
          <p className="text-base text-slate-700 mt-3 leading-relaxed">
            The federal government publishes hundreds of metrics about every college in
            America, but the raw data sits behind a developer API. This site presents
            the same numbers as searchable charts, filterable lists, and printable
            comparison sheets — no spreadsheet wrangling required.
          </p>
        </section>

        {/* Where the data comes from */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Where the data comes from</h2>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed">
            Every number on this site comes directly from the{' '}
            <a
              href="https://collegescorecard.ed.gov/data/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-700 hover:text-indigo-900 underline"
            >
              U.S. Department of Education's College Scorecard
            </a>
            , accessed via its{' '}
            <a
              href="https://collegescorecard.ed.gov/data/api-documentation/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-700 hover:text-indigo-900 underline"
            >
              public API
            </a>
            . The Scorecard combines IPEDS reporting (cost, enrollment, completion),
            federal financial aid records (debt, repayment, default), and IRS tax
            records (post-graduation earnings) into one institution-level dataset.
          </p>
          <p className="text-sm text-slate-700 mt-3 leading-relaxed">
            We don't add, modify, or interpret the underlying data — only the
            visualizations and editorial framing are ours. Where a chart aggregates
            across multiple schools, we explain how (typically a simple median or mean,
            stated in the chart description).
          </p>
        </section>

        {/* Data vintage */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900">How recent is this data?</h2>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed">
            Different metrics come from different reporting cycles. The Scorecard's{' '}
            <code className="bg-slate-100 px-1 rounded text-xs">latest.</code> prefix
            always returns the most-recently-published value per field. Here's the
            current vintage breakdown:
          </p>
          <div className="mt-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Field family</th>
                  <th className="px-3 py-2 text-left font-medium">Most-recent year</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_VINTAGES.map((v) => (
                  <tr key={v.family} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{v.family}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {v.year}
                      {v.note && (
                        <span className="text-slate-400 font-normal"> · {v.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Earnings data lags the most because it requires matching tax records —
            "10-year earnings" means the cohort that <em>started</em> college 10 years
            ago, then was found in IRS records.
          </p>
        </section>

        {/* Methodology FAQ */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900">FAQ &amp; methodology notes</h2>

          <Faq q="Why are some cells empty (—)?">
            The U.S. Department of Education suppresses individual values when the
            underlying cohort is too small (typically fewer than 30 students) to
            protect student privacy. This is normal for small schools, test-optional
            schools (where few students submit scores), and any field tracked through
            federal financial-aid records. An empty cell isn't a missing data fetch —
            it's an intentional privacy redaction at the source.
          </Faq>

          <Faq q="What does 'median earnings' actually measure?">
            Earnings figures count <em>only</em> students who received federal
            financial aid (the Title-IV cohort) and who, when measured, were{' '}
            <em>working but not enrolled</em> in further schooling. So a school with
            many students bound for grad school may show artificially low earnings
            until enough of them enter the workforce. The 10-year horizon mostly
            evens this out; the 6-year does not.
          </Faq>

          <Faq q="Why is my school not showing up?">
            Try clearing filters at the top — the default filter excludes schools under
            2,000 students, for-profit institutions, and schools whose
            predominant credential isn't a bachelor's or graduate degree. You can also
            search by name in the search box or visit{' '}
            <code className="bg-slate-100 px-1 rounded text-xs">
              /school/&lt;school-id&gt;
            </code>{' '}
            directly if you know the IPEDS ID.
          </Faq>

          <Faq q="What does '4-year completion (150% time)' mean?">
            It's the share of full-time students who finish a 4-year degree within 6
            years (which is 150% of the standard 4-year time). Federal stats use this
            buffered window because relatively few students actually graduate in
            exactly four years.
          </Faq>

          <Faq q="What's the difference between 'student debt' and 'Parent PLUS'?">
            Student debt is what graduates themselves owe on federal student loans.
            Parent PLUS is a separate federal loan that a student's parent takes out —
            often to cover the gap between what the student can borrow and what the
            school costs. PLUS isn't on the student's credit report, but it's still
            real debt that affects the family. The Loans &amp; Aid tab shows both.
          </Faq>

          <Faq q="Can I trust the percentile and rank labels?">
            Percentile ranks ("P75", etc.) on the school detail page are computed
            against the schools currently in your filter — not against all 6,000+
            U.S. colleges. So the same school can show different percentiles
            depending on whether you're comparing it to all 4-year publics, just to
            in-state schools, or to private nonprofits only. The filter context is
            always visible above the tabs.
          </Faq>

          <Faq q="How do I share a specific view?">
            Hit the{' '}
            <span className="font-medium">🔗 Share link to this view</span> button in
            the status row above the tabs. The URL it copies includes your active
            filter, tab, and (for unauthenticated visitors) any pinned schools — so
            anyone who opens the link sees the exact same thing you do. School-detail
            pages have their own SEO-friendly URLs (
            <code className="bg-slate-100 px-1 rounded text-xs">
              /school/stanford-university-243744
            </code>
            ).
          </Faq>

          <Faq q="Can I download the data?">
            Yes — every tab has a{' '}
            <span className="font-medium">📥 Export CSV</span> button that downloads
            the columns relevant to that tab, for every school currently in your
            filter. The school detail page also has a{' '}
            <span className="font-medium">🖨️ Print / save as PDF</span> option that
            produces a clean one-school summary, and the{' '}
            <span className="font-medium">📌 Compare</span> tab has the same option
            for side-by-side multi-school sheets.
          </Faq>

          <Faq q="What does this tool *not* show?">
            A few things worth knowing it can't tell you:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Any data about applicants who weren't U.S. residents or didn't apply
                for federal aid — the IRS-matching methodology excludes them.
              </li>
              <li>
                Subjective measures: campus culture, dorms, food, social life,
                athletic conferences, alumni networks.
              </li>
              <li>
                Course-level information: which professors teach what, course catalogs,
                or syllabus details.
              </li>
              <li>
                Acceptance criteria: what test scores or grades a particular school
                will accept. (We show what their <em>admitted</em> students looked
                like, but not what they want.)
              </li>
            </ul>
          </Faq>
        </section>

        {/* Limitations & caveats */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Limitations &amp; caveats</h2>
          <ul className="text-sm text-slate-700 mt-2 leading-relaxed space-y-2 list-disc pl-5">
            <li>
              Federal data has known gaps and biases. Earnings and debt figures
              undersample students who never received federal aid, who tend to be
              wealthier. Treat these as <em>indicative</em>, not authoritative.
            </li>
            <li>
              "Median" in this dashboard always means median across schools (or across
              students, depending on context — the tooltip on each metric clarifies).
              We don't compute weighted averages by enrollment unless we say so.
            </li>
            <li>
              Some methodology shifts in the underlying federal data — like changes to
              how race is reported — can produce sudden jumps in time-series charts.
              These are real, not bugs.
            </li>
            <li>
              We don't have <em>any</em> data on individual students. The dashboard
              only knows institution-level aggregates. Nothing you do here identifies
              or affects any specific person.
            </li>
          </ul>
        </section>

        {/* Tech stack */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Built with</h2>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed">
            React + TypeScript + Tailwind on the front end, Recharts and{' '}
            <code className="bg-slate-100 px-1 rounded text-xs">react-simple-maps</code>{' '}
            for visualizations, Hono + SQLite + Better-Auth on the backend (logged-in
            features only). Source for the underlying data:{' '}
            <a
              href="https://collegescorecard.ed.gov/data/api-documentation/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-700 hover:text-indigo-900 underline"
            >
              api.data.gov / Department of Education
            </a>
            .
          </p>
        </section>

        <footer className="border-t border-slate-200 pt-6 text-xs text-slate-500">
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

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{q}</h3>
      <div className="text-sm text-slate-700 mt-2 leading-relaxed">{children}</div>
    </div>
  );
}
