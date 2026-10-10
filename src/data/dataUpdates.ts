import updatesJson from './dataUpdates.json';

/** One College Scorecard data update, as recorded by scripts/check-data-updates.ts. */
export interface DataUpdate {
  /** ISO date (YYYY-MM-DD) College Trends saw the update. For history entries, the Department's date. */
  date: string;
  /**
   * False for releases recorded from the Department's change log before College Trends
   * started measuring changes (October 2026); those have no per-family counts.
   */
  measured: boolean;
  /** Entry from the Department's change log, when one was published. */
  official?: { date: string; summary: string };
  /** Field families whose values changed, with how many schools changed and the data year now shown. */
  changes: Array<{ family: string; schools: number; year: string | null; previousYear: string | null }>;
  schoolsAdded: number;
  schoolsRemoved: number;
}

export const OFFICIAL_CHANGELOG_URL = 'https://collegescorecard.ed.gov/data/changelog/';

/** Newest first. */
export const DATA_UPDATES: DataUpdate[] = [...(updatesJson as DataUpdate[])].sort((a, b) =>
  a.date < b.date ? 1 : -1,
);
