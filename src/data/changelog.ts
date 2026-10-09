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
