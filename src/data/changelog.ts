export type ChangelogTag = 'New' | 'Improved' | 'Fixed';

export interface ChangelogEntry {
  /** ISO date, YYYY-MM-DD */
  date: string;
  tag: ChangelogTag;
  title: string;
  /** One or two sentences, from a user's perspective. */
  description: string;
  /** Optional bullet points (e.g. capabilities that shipped together). */
  details?: string[];
}

/**
 * User-facing feature changelog, newest first. FEATURE changes and major
 * redesigns only; we leave out small visual tweaks, data refreshes, and copy edits.
 * To add an entry, prepend an object to this array; /changelog renders it.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-11-02',
    tag: 'New',
    title: 'Compare a major across every college',
    description:
      "New pages for 201 bachelor's majors show what graduates earn one and five years after finishing, and what they borrow, at every college that reports it.",
    details: [
      'One chart per major with a dot for each college, filtered by school type or state',
      'A sortable table of every college offering the major',
      'A list of all majors, sortable by earnings and debt',
      'School pages link to their largest majors',
    ],
  },
  {
    date: '2026-11-02',
    tag: 'Fixed',
    title: 'Earnings and debt count each university once',
    description:
      'The Scorecard reports earnings and debt for a whole university, so branch campuses repeat the same figures. Medians on the college group pages now count each university once, so systems with many campuses no longer pull the numbers toward their own.',
  },
  {
    date: '2026-11-02',
    tag: 'Improved',
    title: 'Charts on the Compare view, and pin up to 8 schools',
    description:
      'Compare now draws charts for your pinned schools, and each chart can be saved as an image to share or drop into a document.',
    details: [
      'Net price by family income, grouped by school',
      'Net price, earnings, debt, graduation, retention and admission rates side by side',
      'Download PNG saves a chart with its title, legend and source',
      'Pin up to 8 schools, with new school colors that are easier to tell apart',
    ],
  },
  {
    date: '2026-11-02',
    tag: 'New',
    title: 'Compare whole groups of colleges',
    description:
      'New pages put every public university, private nonprofit college, community college or HBCU on one chart and one table, nationwide or within a state.',
    details: [
      'A chart with one dot per school: pick any two measures, such as net price and earnings',
      'Medians for the group, with the national median shown on state pages',
      'A sortable table of every school, linking to each school page',
      'Start at Browse colleges, or follow the links on any school page',
    ],
  },
  {
    date: '2026-10-10',
    tag: 'New',
    title: 'A record of data updates',
    description:
      'We now check the College Scorecard data every day and list each update below, under Data updates, so you can see when the data last changed and what changed.',
    details: [
      'Which groups of figures changed, and for how many schools',
      'The data year each group of figures comes from, kept current automatically',
      'Department of Education data releases since 2024, with their own notes',
      'The "How recent is this data?" note on every page uses the same measured years',
    ],
  },
  {
    date: '2026-10-10',
    tag: 'Improved',
    title: 'More detailed school pages',
    description:
      'Each school page now opens with a plain-language summary of the school and its key figures, each shown next to the median for similar schools nationwide.',
    details: [
      'A short description of each school: type, location, size, degrees offered, and largest programs',
      'Key figures for enrollment, net price, admit rate, graduation rate, earnings, debt, and first-year retention',
      'Each figure also shows the median and percentile for the schools in your current dashboard filter',
      'A summary of how the school compares with similar schools',
      'Percentages now show one decimal place everywhere on the site',
    ],
  },
  {
    date: '2026-10-08',
    tag: 'Improved',
    title: 'A new look for College Trends',
    description:
      'The site has a new logo, a new typeface, and a redesigned home page built for students, parents, and researchers.',
    details: [
      'New College Trends wordmark, favicon, and link preview image',
      'Cleaner text in Schibsted Grotesk, with numbers that line up in tables and charts',
      'Simple line icons on buttons and quick starts',
      'Missing values now read "n/a" everywhere, so blank data is easy to spot',
    ],
  },
  {
    date: '2026-05-24',
    tag: 'Improved',
    title: 'Redesigned navigation',
    description:
      'The dashboard moved to a left sidebar with grouped, collapsible sections, so it is quicker to jump between cost, earnings, debt, admissions, demographics, and the other views.',
  },
  {
    date: '2026-04-30',
    tag: 'New',
    title: 'Shareable school pages & link previews',
    description:
      'Each school now has its own shareable page (like /school/stanford-university-243744), and links to College Trends unfurl with a preview image and title when pasted into iMessage, Slack, and social apps.',
  },
  {
    date: '2026-04-29',
    tag: 'New',
    title: 'College Trends launched',
    description:
      'The first public release, with everything needed to explore federal college data:',
    details: [
      'Search and filter every accredited U.S. college by size, state, ownership, and degree level',
      'Dedicated views for cost, earnings, debt & repayment, admissions, completion, retention, majors, and demographics',
      'Pin schools to compare them side by side, then print or save the comparison as a PDF',
      'Export any view to CSV, and explore an interactive U.S. map colored by the metric you pick',
      'Copy a link that recreates your exact filters and view to share',
    ],
  },
];
