/**
 * School collections: the groups behind the /colleges pages.
 *
 *   /colleges                         hub
 *   /colleges/<collection>            every school in the collection, nationwide
 *   /colleges/<collection>/<state>    the collection within one state
 *
 * A state page exists only when the state has at least MIN_STATE_SCHOOLS schools
 * in the collection. Which state pages exist is written to collectionStates.json by
 * scripts/build-collections.ts, so the router, the sitemap and school-page links
 * all agree.
 */
import { US_STATES } from './states';
import collectionStatesJson from './collectionStates.json';

export interface CollectionMember {
  ownership: number;
  predominantDegree: number | null;
  hbcu: boolean;
}

export interface Collection {
  slug: string;
  /** Plural, sentence case: "Public universities" */
  label: string;
  /** Plural, lowercase for use mid-sentence: "public universities" */
  noun: string;
  /** Who is included, as a phrase: "public colleges that mostly award bachelor's degrees or higher" */
  definition: string;
  /** One or two sentences for the hub card and page intro. */
  blurb: string;
  includes: (s: CollectionMember) => boolean;
  /** Dashboard filters that reproduce the collection (for "Open in dashboard"). */
  dashboard: { ownership: number[]; degreeLevels: number[] } | null;
}

export const MIN_STATE_SCHOOLS = 3;

export const COLLECTIONS: Collection[] = [
  {
    slug: 'public-universities',
    label: 'Public universities',
    noun: 'public universities',
    definition: "public colleges that mostly award bachelor's degrees or higher",
    blurb:
      "State-funded colleges and universities whose students mostly earn bachelor's or graduate degrees, from flagship campuses to regional universities.",
    includes: (s) => s.ownership === 1 && (s.predominantDegree === 3 || s.predominantDegree === 4),
    dashboard: { ownership: [1], degreeLevels: [3, 4] },
  },
  {
    slug: 'private-nonprofit-colleges',
    label: 'Private nonprofit colleges',
    noun: 'private nonprofit colleges',
    definition: "private nonprofit colleges that mostly award bachelor's degrees or higher",
    blurb:
      "Private nonprofit colleges and universities whose students mostly earn bachelor's or graduate degrees, including liberal arts colleges and research universities.",
    includes: (s) => s.ownership === 2 && (s.predominantDegree === 3 || s.predominantDegree === 4),
    dashboard: { ownership: [2], degreeLevels: [3, 4] },
  },
  {
    slug: 'community-colleges',
    label: 'Community colleges',
    noun: 'community colleges',
    definition: 'public colleges that mostly award associate degrees',
    blurb:
      'Public two-year colleges whose students mostly earn associate degrees, often as a lower-cost path to a job or a transfer to a four-year school.',
    includes: (s) => s.ownership === 1 && s.predominantDegree === 2,
    dashboard: { ownership: [1], degreeLevels: [2] },
  },
  {
    slug: 'hbcus',
    label: 'HBCUs',
    noun: 'HBCUs',
    definition: 'historically Black colleges and universities (HBCUs)',
    blurb:
      'Historically Black colleges and universities, public and private, as designated by the U.S. Department of Education.',
    includes: (s) => s.hbcu,
    dashboard: null,
  },
];

export function findCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

// ---------------------------------------------------------------------------
// States in URLs: /colleges/public-universities/new-york
// ---------------------------------------------------------------------------

export function stateSlug(code: string): string {
  const name = US_STATES.find((s) => s.code === code)?.name ?? code;
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function stateFromSlug(slug: string): { code: string; name: string } | undefined {
  return US_STATES.find((s) => stateSlug(s.code) === slug);
}

/** State codes with a page, per collection slug. */
export const COLLECTION_STATES = collectionStatesJson as Record<string, string[]>;

export function hasStatePage(collectionSlug: string, stateCode: string): boolean {
  return COLLECTION_STATES[collectionSlug]?.includes(stateCode) ?? false;
}

export function collectionPath(collectionSlug?: string, stateCode?: string): string {
  if (!collectionSlug) return '/colleges';
  if (!stateCode) return `/colleges/${collectionSlug}`;
  return `/colleges/${collectionSlug}/${stateSlug(stateCode)}`;
}

export type CollectionRoute =
  | { kind: 'hub' }
  | { kind: 'collection'; collection: Collection; state: { code: string; name: string } | null };

/** Parse /colleges[/<collection>[/<state>]]; null when the page doesn't exist. */
export function parseCollectionPath(path: string): CollectionRoute | null {
  const clean = path.replace(/\/+$/, '');
  const m = clean.match(/^\/colleges(?:\/([a-z0-9-]+))?(?:\/([a-z0-9-]+))?$/);
  if (!m) return null;
  const [, cSlug, sSlug] = m;
  if (!cSlug) return { kind: 'hub' };
  const collection = findCollection(cSlug);
  if (!collection) return null;
  if (!sSlug) return { kind: 'collection', collection, state: null };
  const state = stateFromSlug(sSlug);
  if (!state || !hasStatePage(collection.slug, state.code)) return null;
  return { kind: 'collection', collection, state };
}
