/**
 * Content for the /colleges pages, computed only from College Scorecard fields.
 *
 * Used by the SPA (src/components/collections/*) and by the build-time static HTML
 * (scripts/generate-sitemap.ts), so both always show the same numbers and text.
 *
 * Every summary number is a median across schools: each school counts once,
 * whatever its size. Pages say so. Voice: plain, sourced, neutral; no em dashes.
 */
import {
  COLLECTIONS,
  COLLECTION_STATES,
  MIN_STATE_SCHOOLS,
  collectionPath,
  type Collection,
} from '../data/collections';
import { US_STATES } from '../data/states';
import type { SchoolFacts } from './schoolContent';
import { int, money, pct } from './schoolContent';
import { slugify } from '../util/schoolUrl';

export const SITE_URL = 'https://www.collegetrends.io';

// ---------------------------------------------------------------------------
// Rows: one compact record per school, shipped as /data/collections/<slug>.json
// ---------------------------------------------------------------------------

export interface CollectionRow {
  id: number;
  name: string;
  city: string;
  state: string;
  ownership: number;
  predominantDegree: number | null;
  hbcu: boolean;
  size: number | null;
  netPrice: number | null;
  tuitionIn: number | null;
  tuitionOut: number | null;
  admitRate: number | null;
  /** Share finishing within 150% of normal time (4-year or less-than-4-year rate, whichever applies). */
  gradRate: number | null;
  /** Full-time first-year students returning for year two. */
  retention: number | null;
  earnings10: number | null;
  medianDebt: number | null;
}

export function rowFromFacts(f: SchoolFacts): CollectionRow {
  return {
    id: f.id,
    name: f.name,
    city: f.city,
    state: f.state,
    ownership: f.ownership,
    predominantDegree: f.predominantDegree,
    hbcu: f.hbcu,
    size: f.size,
    netPrice: f.netPrice,
    tuitionIn: f.tuitionIn ?? null,
    tuitionOut: f.tuitionOut ?? null,
    admitRate: f.admitRate,
    // A school reports one or the other, by its level.
    gradRate: f.completion ?? f.completionLt4 ?? null,
    retention: f.retention ?? f.retentionLt4 ?? null,
    earnings10: f.earnings10,
    medianDebt: f.medianDebt,
  };
}

/** Rows for every collection, sorted by name, plus which state pages exist. */
export function buildCollectionData(facts: SchoolFacts[]): {
  rows: Record<string, CollectionRow[]>;
  states: Record<string, string[]>;
} {
  const validStates = new Set(US_STATES.map((s) => s.code));
  const rows: Record<string, CollectionRow[]> = {};
  const states: Record<string, string[]> = {};
  for (const c of COLLECTIONS) {
    const list = facts
      .filter((f) => c.includes(f))
      .map(rowFromFacts)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    rows[c.slug] = list;
    const counts = new Map<string, number>();
    for (const r of list) counts.set(r.state, (counts.get(r.state) ?? 0) + 1);
    states[c.slug] = [...counts.entries()]
      .filter(([code, n]) => validStates.has(code) && n >= MIN_STATE_SCHOOLS)
      .map(([code]) => code)
      .sort();
  }
  return { rows, states };
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export type RowMetric =
  | 'netPrice'
  | 'tuitionIn'
  | 'tuitionOut'
  | 'earnings10'
  | 'medianDebt'
  | 'gradRate'
  | 'retention'
  | 'admitRate'
  | 'size';

export interface MetricDef {
  key: RowMetric;
  label: string;
  /** Short column header */
  short: string;
  format: (v: number) => string;
  /** Compact axis tick */
  tick: (v: number) => string;
  tip: string;
}

const kMoney = (v: number) => `$${Math.round(v / 1000)}k`;
const wholePct = (v: number) => `${Math.round(v * 100)}%`;

export const METRICS: Record<RowMetric, MetricDef> = {
  netPrice: {
    key: 'netPrice',
    label: 'Average net price',
    short: 'Net price',
    format: money,
    tick: kMoney,
    tip: 'Average yearly cost for full-time, first-time undergraduates who receive federal aid, after grants and scholarships.',
  },
  tuitionIn: {
    key: 'tuitionIn',
    label: 'In-state tuition',
    short: 'In-state tuition',
    format: money,
    tick: kMoney,
    tip: 'Published yearly tuition and fees for students who live in the state.',
  },
  tuitionOut: {
    key: 'tuitionOut',
    label: 'Out-of-state tuition',
    short: 'Out-of-state tuition',
    format: money,
    tick: kMoney,
    tip: 'Published yearly tuition and fees for students from other states.',
  },
  earnings10: {
    key: 'earnings10',
    label: 'Median earnings 10 years after entry',
    short: 'Earnings',
    format: money,
    tick: kMoney,
    tip: 'Median earnings of former students who received federal aid, 10 years after they started college, among those working and not enrolled.',
  },
  medianDebt: {
    key: 'medianDebt',
    label: 'Median debt at graduation',
    short: 'Debt',
    format: money,
    tick: kMoney,
    tip: 'Median federal student-loan balance of graduates. Excludes Parent PLUS and private loans.',
  },
  gradRate: {
    key: 'gradRate',
    label: 'Graduation rate',
    short: 'Grad rate',
    format: pct,
    tick: wholePct,
    tip: 'Share of full-time, first-time students who finished within 150% of normal time (6 years for a 4-year degree, 3 years for a 2-year degree).',
  },
  retention: {
    key: 'retention',
    label: 'First-year retention',
    short: 'Retention',
    format: pct,
    tick: wholePct,
    tip: 'Share of full-time, first-time students who came back for a second year.',
  },
  admitRate: {
    key: 'admitRate',
    label: 'Admission rate',
    short: 'Admit rate',
    format: pct,
    tick: wholePct,
    tip: 'Share of applicants who were admitted. Open-admission schools usually do not report one.',
  },
  size: {
    key: 'size',
    label: 'Undergraduates',
    short: 'Undergrads',
    format: int,
    tick: (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)),
    tip: 'Undergraduate degree-seeking enrollment.',
  },
};

/** Metrics worth showing for a collection (tuition only splits by residency at public schools). */
export function metricsFor(c: Collection): RowMetric[] {
  const pub = c.slug === 'public-universities' || c.slug === 'community-colleges';
  const base: RowMetric[] = ['netPrice', 'earnings10', 'medianDebt', 'gradRate', 'retention'];
  if (pub) base.splice(1, 0, 'tuitionIn', 'tuitionOut');
  else base.splice(1, 0, 'tuitionIn');
  // Most community colleges are open admission, so admit rate is mostly blank there.
  if (c.slug !== 'community-colleges') base.push('admitRate');
  return base;
}

// ---------------------------------------------------------------------------
// Summary statistics
// ---------------------------------------------------------------------------

export interface MetricStat {
  median: number;
  /** Schools reporting this metric. */
  n: number;
  low: CollectionRow;
  high: CollectionRow;
}

export interface Summary {
  count: number;
  /** Sum of undergraduate enrollment across schools reporting it. */
  students: number;
  metrics: Partial<Record<RowMetric, MetricStat>>;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function summarize(rows: CollectionRow[]): Summary {
  const metrics: Summary['metrics'] = {};
  for (const key of Object.keys(METRICS) as RowMetric[]) {
    const have = rows.filter((r) => r[key] !== null);
    if (have.length === 0) continue;
    const sorted = [...have].sort((a, b) => (a[key] as number) - (b[key] as number));
    metrics[key] = {
      median: median(have.map((r) => r[key] as number)),
      n: have.length,
      low: sorted[0],
      high: sorted[sorted.length - 1],
    };
  }
  return {
    count: rows.length,
    students: rows.reduce((t, r) => t + (r.size ?? 0), 0),
    metrics,
  };
}

/** The `n` rows with the lowest (or highest) value of a metric. */
export function extremes(
  rows: CollectionRow[],
  key: RowMetric,
  dir: 'low' | 'high',
  n = 5,
): CollectionRow[] {
  return rows
    .filter((r) => r[key] !== null)
    .sort((a, b) =>
      dir === 'low' ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number),
    )
    .slice(0, n);
}

export interface StateBreakdown {
  code: string;
  name: string;
  count: number;
  summary: Summary;
  hasPage: boolean;
}

export function byState(c: Collection, rows: CollectionRow[]): StateBreakdown[] {
  const groups = new Map<string, CollectionRow[]>();
  for (const r of rows) (groups.get(r.state) ?? groups.set(r.state, []).get(r.state)!).push(r);
  return US_STATES.filter((s) => groups.has(s.code)).map((s) => {
    const list = groups.get(s.code)!;
    return {
      code: s.code,
      name: s.name,
      count: list.length,
      summary: summarize(list),
      hasPage: COLLECTION_STATES[c.slug]?.includes(s.code) ?? false,
    };
  });
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export interface Place {
  code: string;
  name: string;
}

const placeName = (state: Place | null) => (state ? state.name : 'the United States');

export const schoolPath = (r: Pick<CollectionRow, 'id' | 'name'>) => `/school/${slugify(r.name)}-${r.id}`;

/** "about the same as", "higher than", "lower than" with a tolerance. */
function versus(value: number, ref: number, kind: 'rate' | 'amount'): string {
  const close = kind === 'rate' ? Math.abs(value - ref) < 0.02 : Math.abs(value - ref) / ref < 0.05;
  if (close) return 'about the same as';
  return value > ref ? 'higher than' : 'lower than';
}

const isRate = (k: RowMetric) => k === 'gradRate' || k === 'retention' || k === 'admitRate';

function compareClause(
  key: RowMetric,
  local: Summary,
  national: Summary | null,
  noun: string,
): string {
  const a = local.metrics[key];
  const b = national?.metrics[key];
  if (!a || !b) return '';
  return `, ${versus(a.median, b.median, isRate(key) ? 'rate' : 'amount')} the ${METRICS[key].format(
    b.median,
  )} median for ${noun} nationwide`;
}

/** Opening paragraph: what the page covers and the headline numbers. */
export function collectionIntro(
  c: Collection,
  state: Place | null,
  local: Summary,
  national: Summary | null,
): string[] {
  const out: string[] = [];
  const where = placeName(state);
  const one = local.count === 1;
  out.push(
    `The College Scorecard lists ${int(local.count)} ${c.definition} in ${where}${
      one ? '' : ', all compared on this page'
    }.`,
  );
  if (local.students > 0) {
    out.push(
      `${one ? 'It enrolls' : 'Together they enroll'} ${int(local.students)} undergraduate degree-seeking students.`,
    );
  }
  const np = local.metrics.netPrice;
  if (np) {
    out.push(
      `The median average net price is ${money(np.median)} a year${compareClause(
        'netPrice',
        local,
        state ? national : null,
        c.noun,
      )}.`,
    );
  }
  const earn = local.metrics.earnings10;
  if (earn) {
    out.push(
      `Former students' median earnings 10 years after starting college are ${money(
        earn.median,
      )} at the median school${compareClause('earnings10', local, state ? national : null, c.noun)}.`,
    );
  }
  const grad = local.metrics.gradRate;
  if (grad) {
    out.push(`The median graduation rate is ${pct(grad.median)}.`);
  }
  return out;
}

export interface QuickFact {
  q: string;
  a: string;
}

function nameList(rows: CollectionRow[], key: RowMetric): string {
  const items = rows.map((r) => `${r.name} (${METRICS[key].format(r[key] as number)})`);
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/** Question-and-answer facts. Rendered on the page and as FAQPage structured data. */
export function quickFacts(c: Collection, state: Place | null, rows: CollectionRow[], local: Summary): QuickFact[] {
  const where = placeName(state);
  const out: QuickFact[] = [];
  out.push({
    q: `How many ${c.noun} are in ${where}?`,
    a: `The College Scorecard lists ${int(local.count)} ${c.definition} in ${where}.`,
  });

  const np = local.metrics.netPrice;
  if (np) {
    const span =
      np.n > 1
        ? ` Reported net prices range from ${money(np.low.netPrice!)} at ${np.low.name} to ${money(
            np.high.netPrice!,
          )} at ${np.high.name}.`
        : '';
    out.push({
      q: `What do ${c.noun} in ${where} cost?`,
      a: `Across the ${int(np.n)} ${np.n === 1 ? 'school' : 'schools'} that report it, the median average net price is ${money(
        np.median,
      )} a year. Net price is what full-time, first-time students receiving federal aid pay after grants and scholarships.${span}`,
    });
    if (np.n >= 3) {
      const low = extremes(rows, 'netPrice', 'low', Math.min(5, np.n));
      out.push({
        q: `Which ${c.noun} in ${where} have the lowest average net price?`,
        a: `By reported average net price: ${nameList(low, 'netPrice')}.`,
      });
    }
  }

  const tin = local.metrics.tuitionIn;
  const tout = local.metrics.tuitionOut;
  if (tin && tout && (c.slug === 'public-universities' || c.slug === 'community-colleges')) {
    out.push({
      q: `How much is in-state and out-of-state tuition at ${c.noun} in ${where}?`,
      a: `The median published in-state tuition is ${money(tin.median)} a year, and the median out-of-state tuition is ${money(
        tout.median,
      )}. Many students pay less than published tuition after aid.`,
    });
  }

  const earn = local.metrics.earnings10;
  if (earn) {
    const top = earn.n >= 3 ? extremes(rows, 'earnings10', 'high', Math.min(3, earn.n)) : [];
    out.push({
      q: `How much do former students of ${c.noun} in ${where} earn?`,
      a: `At the median school, former students who received federal aid earn ${money(
        earn.median,
      )} 10 years after starting college.${
        top.length ? ` The highest reported medians are at ${nameList(top, 'earnings10')}.` : ''
      }`,
    });
  }

  const grad = local.metrics.gradRate;
  if (grad) {
    out.push({
      q: `What is the graduation rate at ${c.noun} in ${where}?`,
      a: `The median graduation rate is ${pct(grad.median)}, across ${int(grad.n)} ${
        grad.n === 1 ? 'school' : 'schools'
      } reporting. It counts full-time, first-time students who finished within 150% of normal time.`,
    });
  }

  const debt = local.metrics.medianDebt;
  if (debt) {
    out.push({
      q: `How much student debt do graduates of ${c.noun} in ${where} have?`,
      a: `The median school's graduates leave with ${money(
        debt.median,
      )} in federal student loans (the median balance). Parent PLUS and private loans are not included.`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Title, meta description, structured data
// ---------------------------------------------------------------------------

const TITLE_MAX = 65;
const META_MAX = 160;

const titleCase = (s: string) =>
  s.replace(/\b([a-z])([a-z]*)/g, (_, a: string, b: string) => a.toUpperCase() + b);

export function collectionTitle(c: Collection, state: Place | null, count: number): string {
  const label = titleCase(c.label);
  const n = int(count);
  const options = state
    ? [
        `${n} ${label} in ${state.name}: Cost, Earnings & Debt | College Trends`,
        `${n} ${label} in ${state.name}: Cost & Earnings | College Trends`,
        `${label} in ${state.name}: Cost & Earnings | College Trends`,
        `${label} in ${state.name} | College Trends`,
      ]
    : [
        `Compare All ${n} ${label} in the U.S. | College Trends`,
        `All ${n} ${label} in the U.S. | College Trends`,
        `${label} in the U.S. | College Trends`,
      ];
  return options.find((t) => t.length <= TITLE_MAX) ?? options[options.length - 1];
}

export function collectionMeta(c: Collection, state: Place | null, local: Summary): string {
  const where = state ? state.name : 'the U.S.';
  const parts: string[] = [];
  const np = local.metrics.netPrice;
  const earn = local.metrics.earnings10;
  if (np) parts.push(`median net price ${money(np.median)}`);
  if (earn) parts.push(`median earnings ${money(earn.median)}`);
  const head = `Compare ${int(local.count)} ${c.noun} in ${where}`;
  const tail = ' College Scorecard data.';
  for (let k = parts.length; k >= 0; k--) {
    const text = `${head}${k ? `: ${parts.slice(0, k).join(', ')}` : ''}, plus graduation rates and debt.${tail}`;
    if (text.length <= META_MAX) return text;
  }
  return `${head}.${tail}`;
}

export const HUB_TITLE = 'Compare U.S. Colleges by Type and State | College Trends';
export const HUB_META =
  'Compare cost, earnings, graduation rates and debt across every public university, private nonprofit college, community college and HBCU in the U.S., nationwide or by state.';

export function collectionJsonLd(
  c: Collection,
  state: Place | null,
  rows: CollectionRow[],
  facts: QuickFact[],
  title: string,
  description: string,
): Record<string, unknown> {
  const url = SITE_URL + collectionPath(c.slug, state?.code);
  const crumbs = [
    { name: 'Colleges', url: SITE_URL + collectionPath() },
    { name: c.label, url: SITE_URL + collectionPath(c.slug) },
    ...(state ? [{ name: state.name, url }] : []),
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url,
        url,
        name: title.replace(/ \| College Trends$/, ''),
        description,
        isPartOf: { '@type': 'WebSite', name: 'College Trends', url: SITE_URL },
        about: `${c.label} in ${placeName(state)}`,
        citation: 'U.S. Department of Education College Scorecard',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: rows.length,
          itemListElement: rows.slice(0, 100).map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: r.name,
            url: SITE_URL + schoolPath(r),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: facts.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Hub (/colleges): one small summary per collection
// ---------------------------------------------------------------------------

export interface HubEntry {
  count: number;
  students: number;
  netPrice: number | null;
  earnings10: number | null;
  gradRate: number | null;
}

export type HubSummary = Record<string, HubEntry>;

export function hubSummary(rows: Record<string, CollectionRow[]>): HubSummary {
  const out: HubSummary = {};
  for (const [slug, list] of Object.entries(rows)) {
    const s = summarize(list);
    out[slug] = {
      count: s.count,
      students: s.students,
      netPrice: s.metrics.netPrice?.median ?? null,
      earnings10: s.metrics.earnings10?.median ?? null,
      gradRate: s.metrics.gradRate?.median ?? null,
    };
  }
  return out;
}
