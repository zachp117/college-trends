/**
 * Which /majors/<slug> pages exist. majorPages.json is written by
 * scripts/build-collections.ts and committed, so routing and links from school
 * pages work in dev and key-less builds.
 */
import majorPagesJson from './majorPages.json';
import type { MajorInfo } from '../seo/majorContent';

export const MAJOR_PAGES = majorPagesJson as MajorInfo[];

const BY_SLUG = new Map(MAJOR_PAGES.map((m) => [m.slug, m]));
const BY_TITLE = new Map(MAJOR_PAGES.map((m) => [m.title.toLowerCase(), m]));

export function findMajor(slug: string): MajorInfo | undefined {
  return BY_SLUG.get(slug);
}

/** Match a program title (as shown on school pages) to its major page. */
export function majorForTitle(title: string): MajorInfo | undefined {
  return BY_TITLE.get(title.replace(/\.\s*$/, '').trim().toLowerCase());
}

export type MajorRoute = { kind: 'hub' } | { kind: 'major'; major: MajorInfo };

/** Parse /majors[/<slug>]; null when the page doesn't exist. */
export function parseMajorPath(path: string): MajorRoute | null {
  const m = path.replace(/\/+$/, '').match(/^\/majors(?:\/([a-z0-9-]+))?$/);
  if (!m) return null;
  if (!m[1]) return { kind: 'hub' };
  const major = findMajor(m[1]);
  return major ? { kind: 'major', major } : null;
}
