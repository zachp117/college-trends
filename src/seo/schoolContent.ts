/**
 * Per-school SEO content, generated only from College Scorecard fields.
 *
 * Used in two places so they always match:
 *   - the SPA school page (src/tabs/SchoolDetail.tsx via SchoolIntro), and
 *   - the build-time static HTML for /school/<slug>-<id> (scripts/generate-sitemap.ts),
 *     so crawlers get the title, description, headings and text without running JS.
 *
 * Voice: plain, sourced, neutral. No rankings or superlatives, no em dashes, no
 * "X, not Y" constructions. Every sentence states a reported value; a sentence is
 * dropped when its value is missing (suppressed or not reported).
 */
import type { School, Program } from '../api/scorecard';
import { US_STATES } from '../data/states';
import nameCollisionsJson from '../data/schoolNameCollisions.json';

/** Lowercased names shared by more than one school (written by fetch-school-data). */
const NAME_COLLISIONS = new Set<string>(nameCollisionsJson as string[]);

/** Names that appear on more than one school in the dataset, lowercased. */
export function nameCollisions(all: Pick<SchoolFacts, 'name'>[]): string[] {
  const counts = new Map<string, number>();
  for (const f of all) {
    const k = f.name.trim().toLowerCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k).sort();
}

// ---------------------------------------------------------------------------
// Facts: the minimal, flat shape both the SPA and the build script produce
// ---------------------------------------------------------------------------

export interface SchoolFacts {
  id: number;
  name: string;
  city: string;
  state: string;
  url: string | null;
  ownership: number;
  locale: number | null;
  predominantDegree: number | null;
  highestDegree: number | null;
  religious: boolean;
  hbcu: boolean;
  hsi: boolean;
  onlineOnly: boolean;
  /** Undergraduate degree-seeking enrollment. */
  size: number | null;
  netPrice: number | null;
  admitRate: number | null;
  /** 4-year schools: share finishing within 6 years (150% time). */
  completion: number | null;
  earnings10: number | null;
  medianDebt: number | null;
  /** 4-year schools: first-time, full-time students returning for year two. */
  retention: number | null;
  /** Largest programs by awards at the school's main credential level. */
  topPrograms: string[];
}

/** Scorecard API field paths the build script requests (one row per school). */
export const FACT_FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.school_url',
  'school.ownership',
  'school.locale',
  'school.degrees_awarded.predominant',
  'school.degrees_awarded.highest',
  'school.religious_affiliation',
  'school.minority_serving.historically_black',
  'school.minority_serving.hispanic',
  'school.online_only',
  'latest.student.size',
  'latest.cost.avg_net_price.overall',
  'latest.admissions.admission_rate.overall',
  'latest.completion.completion_rate_4yr_150nt',
  'latest.earnings.10_yrs_after_entry.median',
  'latest.aid.median_debt.completers.overall',
  'latest.student.retention_rate.four_year.full_time',
  'latest.programs.cip_4_digit.title',
  'latest.programs.cip_4_digit.credential.level',
  'latest.programs.cip_4_digit.counts.ipeds_awards2',
] as const;

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const flag = (v: unknown): boolean => v === 1;
/** Scorecard uses null or negative codes (-1, -2) for "not applicable / none". */
const hasReligiousAffiliation = (v: unknown): boolean => typeof v === 'number' && v > 0;

interface ProgramLike {
  title: string;
  level: number;
  awards: number | null;
}

/** Credential level whose programs best describe the school. */
function programLevelFor(predominantDegree: number | null): number | null {
  switch (predominantDegree) {
    case 1:
      return 1; // undergraduate certificate
    case 2:
      return 2; // associate
    case 3:
      return 3; // bachelor's
    case 4:
      return 5; // master's
    default:
      return null;
  }
}

export function topProgramsFrom(
  programs: ProgramLike[],
  predominantDegree: number | null,
  limit = 3,
): string[] {
  const level = programLevelFor(predominantDegree);
  if (level === null) return [];
  const totals = new Map<string, number>();
  for (const p of programs) {
    if (p.level !== level || !p.awards || p.awards <= 0) continue;
    const title = p.title.replace(/\.\s*$/, '').trim();
    if (!title) continue;
    totals.set(title, (totals.get(title) ?? 0) + p.awards);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([title]) => title);
}

/** Build facts from one raw API row requested with FACT_FIELDS. */
export function factsFromApiRow(r: Record<string, unknown>): SchoolFacts {
  const predominantDegree = num(r['school.degrees_awarded.predominant']);
  const rawPrograms = (r['latest.programs.cip_4_digit'] as Array<Record<string, unknown>>) ?? [];
  const programs: ProgramLike[] = rawPrograms.map((p) => ({
    title: String(p.title ?? ''),
    level: num((p.credential as Record<string, unknown> | undefined)?.level) ?? 0,
    awards: num((p.counts as Record<string, unknown> | undefined)?.ipeds_awards2),
  }));
  return {
    id: Number(r.id),
    name: String(r['school.name'] ?? ''),
    city: String(r['school.city'] ?? ''),
    state: String(r['school.state'] ?? ''),
    url: (r['school.school_url'] as string | null) ?? null,
    ownership: num(r['school.ownership']) ?? 0,
    locale: num(r['school.locale']),
    predominantDegree,
    highestDegree: num(r['school.degrees_awarded.highest']),
    religious: hasReligiousAffiliation(r['school.religious_affiliation']),
    hbcu: flag(r['school.minority_serving.historically_black']),
    hsi: flag(r['school.minority_serving.hispanic']),
    onlineOnly: flag(r['school.online_only']),
    size: num(r['latest.student.size']),
    netPrice: num(r['latest.cost.avg_net_price.overall']),
    admitRate: num(r['latest.admissions.admission_rate.overall']),
    completion: num(r['latest.completion.completion_rate_4yr_150nt']),
    earnings10: num(r['latest.earnings.10_yrs_after_entry.median']),
    medianDebt: num(r['latest.aid.median_debt.completers.overall']),
    retention: num(r['latest.student.retention_rate.four_year.full_time']),
    topPrograms: topProgramsFrom(programs, predominantDegree),
  };
}

/** Build facts from the SPA's School object plus its fetched programs. */
export function factsFromSchool(s: School, programs: Program[]): SchoolFacts {
  return {
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    url: s.url,
    ownership: s.ownership,
    locale: s.locale,
    predominantDegree: s.predominantDegree,
    highestDegree: s.highestDegree,
    religious: hasReligiousAffiliation(s.religiousAffiliation),
    hbcu: s.hbcu === 1,
    hsi: s.hsi === 1,
    onlineOnly: s.onlineOnly === 1,
    size: s.size,
    netPrice: s.avgCost,
    admitRate: s.admissionRate,
    completion: s.completionRate,
    earnings10: s.medianEarnings10,
    medianDebt: s.medianDebt,
    retention: s.retentionFt4yr,
    topPrograms: topProgramsFrom(
      programs
        .filter((p) => p.schoolId === s.id)
        .map((p) => ({ title: p.title, level: p.credentialLevel, awards: p.completers2 })),
      s.predominantDegree,
    ),
  };
}

// ---------------------------------------------------------------------------
// Peer groups: same ownership + same predominant degree, nationwide
// ---------------------------------------------------------------------------

export type PeerMetric =
  | 'size'
  | 'netPrice'
  | 'admitRate'
  | 'completion'
  | 'earnings10'
  | 'medianDebt'
  | 'retention';

export const PEER_METRICS: PeerMetric[] = [
  'size',
  'netPrice',
  'admitRate',
  'completion',
  'earnings10',
  'medianDebt',
  'retention',
];

export interface PeerStat {
  median: number;
  /** Schools in the group reporting this metric. */
  n: number;
}

export interface PeerGroup {
  /** Schools in the group. */
  count: number;
  metrics: Partial<Record<PeerMetric, PeerStat>>;
}

export type PeerMedians = Record<string, PeerGroup>;

/** Below this many reporting schools we don't quote a peer median. */
export const MIN_PEERS = 10;

export function peerKey(f: Pick<SchoolFacts, 'ownership' | 'predominantDegree'>): string | null {
  if (!f.ownership || !f.predominantDegree) return null;
  return `${f.ownership}-${f.predominantDegree}`;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function computePeerMedians(all: SchoolFacts[]): PeerMedians {
  const groups = new Map<string, SchoolFacts[]>();
  for (const f of all) {
    const k = peerKey(f);
    if (!k) continue;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(f);
  }
  const out: PeerMedians = {};
  for (const [k, list] of [...groups.entries()].sort()) {
    const metrics: PeerGroup['metrics'] = {};
    for (const m of PEER_METRICS) {
      const vals = list.map((f) => f[m]).filter((v): v is number => v !== null);
      if (vals.length > 0) metrics[m] = { median: median(vals), n: vals.length };
    }
    out[k] = { count: list.length, metrics };
  }
  return out;
}

export function peerStat(
  f: SchoolFacts,
  peers: PeerMedians,
  m: PeerMetric,
): PeerStat | null {
  const k = peerKey(f);
  const s = k ? peers[k]?.metrics[m] : undefined;
  return s && s.n >= MIN_PEERS ? s : null;
}

const OWNERSHIP_ADJ: Record<number, string> = {
  1: 'public',
  2: 'private nonprofit',
  3: 'private for-profit',
};

const DEGREE_NOUN: Record<number, string> = {
  1: 'certificates',
  2: "associate degrees",
  3: "bachelor's degrees",
  4: 'graduate degrees',
};

/** e.g. "public schools that mostly award bachelor's degrees" */
export function peerLabel(f: SchoolFacts): string | null {
  const own = OWNERSHIP_ADJ[f.ownership];
  const deg = f.predominantDegree ? DEGREE_NOUN[f.predominantDegree] : undefined;
  if (!own || !deg) return null;
  return `${own} schools that mostly award ${deg}`;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const moneyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const intFmt = new Intl.NumberFormat('en-US');

export const money = (v: number) => moneyFmt.format(v);
/** One decimal, matching fmtPct elsewhere on the site. */
export const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
/** Whole percent, for the length-limited meta description only. */
const pctWhole = (v: number) => `${Math.round(v * 100)}%`;
export const int = (v: number) => intFmt.format(Math.round(v));

export function stateName(code: string): string {
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}

const LOCALE_PHRASE: Record<number, string> = {
  11: 'a large city',
  12: 'a midsize city',
  13: 'a small city',
  21: 'a large suburb',
  22: 'a midsize suburb',
  23: 'a small suburb',
  31: 'a town on the fringe of an urban area',
  32: 'a distant town',
  33: 'a remote town',
  41: 'a rural area on the fringe of an urban area',
  42: 'a distant rural area',
  43: 'a remote rural area',
};

/** Higher / lower / about the same, with a tolerance so tiny gaps read as "about". */
function compareWord(
  value: number,
  peer: number,
  kind: 'rate' | 'amount',
): 'higher than' | 'lower than' | 'about the same as' {
  const close = kind === 'rate' ? Math.abs(value - peer) < 0.02 : Math.abs(value - peer) / peer < 0.05;
  if (close) return 'about the same as';
  return value > peer ? 'higher than' : 'lower than';
}

// ---------------------------------------------------------------------------
// Title tag + meta description
// ---------------------------------------------------------------------------

const TITLE_MAX = 65;

export function titleTag(f: SchoolFacts): string {
  // Several schools share a name (chains, same-name campuses): add the location
  // so every page gets a unique title.
  const name = NAME_COLLISIONS.has(f.name.trim().toLowerCase())
    ? `${f.name} (${f.city}, ${f.state})`
    : f.name;
  const options = [
    `${name}: Cost, Admissions & Outcomes | College Trends`,
    `${name}: Cost & Outcomes | College Trends`,
    `${name} | College Trends`,
  ];
  return options.find((t) => t.length <= TITLE_MAX) ?? options[options.length - 1];
}

const META_MAX = 160;

export function metaDescription(f: SchoolFacts): string {
  const where = f.city && f.state ? ` in ${f.city}, ${f.state}` : '';
  const parts: string[] = [];
  if (f.netPrice !== null) parts.push(`average net price ${money(f.netPrice)}`);
  if (f.admitRate !== null) parts.push(`${pctWhole(f.admitRate)} admit rate`);
  if (f.completion !== null) parts.push(`${pctWhole(f.completion)} graduation rate`);
  if (f.earnings10 !== null) parts.push(`${money(f.earnings10)} median earnings`);
  if (f.medianDebt !== null) parts.push(`${money(f.medianDebt)} median debt`);
  const tail = ' Federal College Scorecard data.';
  // Drop trailing stats until it fits.
  for (let k = parts.length; k >= 0; k--) {
    const body = k > 0 ? `${f.name}${where}: ${parts.slice(0, k).join(', ')}.` : '';
    const text =
      k > 0
        ? body + tail
        : `Cost, admissions, earnings and debt data for ${f.name}${where}, from the federal College Scorecard.`;
    if (text.length <= META_MAX || k === 0) return text;
  }
  return `${f.name}${where}.${tail}`;
}

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

export type SectionTopic =
  | 'glance'
  | 'overview'
  | 'cost'
  | 'admissions'
  | 'outcomes'
  | 'retention'
  | 'students'
  | 'faculty'
  | 'programs'
  | 'trends';

export function sectionHeading(name: string, topic: SectionTopic, programNoun = "bachelor's"): string {
  switch (topic) {
    case 'glance':
      return `${name} at a glance`;
    case 'overview':
      return `What the data shows about ${name}`;
    case 'cost':
      return `${name} cost and financial aid`;
    case 'admissions':
      return `${name} admissions`;
    case 'outcomes':
      return `Earnings after attending ${name}`;
    case 'retention':
      return `Retention and graduation at ${name}`;
    case 'students':
      return `Who attends ${name}`;
    case 'faculty':
      return `${name} faculty`;
    case 'programs':
      return `Top ${programNoun} programs at ${name}`;
    case 'trends':
      return `${name} trends over time`;
  }
}

// ---------------------------------------------------------------------------
// Description (who the school is) and overview (what the numbers say)
// ---------------------------------------------------------------------------

const PROGRAM_NOUN: Record<number, string> = {
  1: 'certificate',
  2: 'associate',
  3: "bachelor's",
  4: "master's",
};

function joinList(items: string[]): string {
  // Program titles can contain commas, so separate with semicolons when they do.
  const sep = items.some((t) => t.includes(',')) ? '; ' : ', ';
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]}${sep === '; ' ? ';' : ''} and ${items[1]}`;
  return `${items.slice(0, -1).join(sep)}${sep.trim()} and ${items[items.length - 1]}`;
}

/** Short description of the school: identity facts only. Returns sentences. */
export function schoolDescription(f: SchoolFacts): string[] {
  const out: string[] = [];
  const own = OWNERSHIP_ADJ[f.ownership];
  const place = [f.city, f.state ? stateName(f.state) : ''].filter(Boolean).join(', ');
  const setting = f.locale !== null ? LOCALE_PHRASE[f.locale] : undefined;
  // Two phrasings, picked by id, so thousands of pages don't all open identically.
  const variant = f.id % 2;

  if (own && place) {
    const settingPart = setting ? `, ${variant ? 'located in' : 'set in'} ${setting}` : '';
    out.push(`${f.name} is a ${own} college in ${place}${settingPart}.`);
  } else if (place) {
    out.push(`${f.name} is a college in ${place}.`);
  }

  const deg = f.predominantDegree ? DEGREE_NOUN[f.predominantDegree] : undefined;
  if (f.size !== null && f.size > 0 && deg) {
    out.push(
      variant
        ? `It enrolls ${int(f.size)} undergraduate degree-seeking students and mostly awards ${deg}.`
        : `It mostly awards ${deg} and has ${int(f.size)} undergraduate degree-seeking students.`,
    );
  } else if (deg) {
    out.push(`It mostly awards ${deg}.`);
  }
  if (f.highestDegree === 4 && f.predominantDegree !== 4) {
    out.push('It also offers graduate degrees.');
  }

  const designations: string[] = [];
  if (f.hbcu) designations.push('a historically Black college or university (HBCU)');
  if (f.hsi) designations.push('a Hispanic-serving institution');
  if (designations.length) out.push(`It is ${designations.join(' and ')}.`);
  if (f.religious) out.push('It reports a religious affiliation.');
  if (f.onlineOnly) out.push('It offers its programs entirely online.');

  if (f.topPrograms.length > 0 && f.predominantDegree) {
    const levelNoun = PROGRAM_NOUN[f.predominantDegree] ?? '';
    const what = f.topPrograms.length === 1 ? 'program' : 'programs';
    out.push(
      `By number of ${levelNoun} degrees awarded, its largest ${what} ${
        f.topPrograms.length === 1 ? 'is' : 'are'
      } ${joinList(f.topPrograms)}.`,
    );
  }
  return out;
}

/** Contextual summary of the data on the page, against similar schools nationwide. */
export function schoolOverview(f: SchoolFacts, peers: PeerMedians): string[] {
  const out: string[] = [];
  const label = peerLabel(f);
  const k = peerKey(f);
  const group = k ? peers[k] : undefined;
  if (label && group && group.count >= MIN_PEERS) {
    out.push(
      `Comparisons below use the medians for the ${int(group.count)} ${label} in the College Scorecard.`,
    );
  }

  const p = (m: PeerMetric) => peerStat(f, peers, m);

  if (f.netPrice !== null) {
    const s = p('netPrice');
    out.push(
      s
        ? `Its average net price is ${money(f.netPrice)} a year, ${compareWord(f.netPrice, s.median, 'amount')} the ${money(s.median)} median for similar schools.`
        : `Its average net price is ${money(f.netPrice)} a year.`,
    );
  }
  if (f.admitRate !== null) {
    const s = p('admitRate');
    out.push(
      s
        ? `It admits ${pct(f.admitRate)} of applicants, ${compareWord(f.admitRate, s.median, 'rate')} the ${pct(s.median)} median.`
        : `It admits ${pct(f.admitRate)} of applicants.`,
    );
  }
  if (f.retention !== null) {
    const s = p('retention');
    out.push(
      s
        ? `${pct(f.retention)} of first-time, full-time students return for a second year (similar-school median: ${pct(s.median)}).`
        : `${pct(f.retention)} of first-time, full-time students return for a second year.`,
    );
  }
  if (f.completion !== null) {
    const s = p('completion');
    out.push(
      s
        ? `${pct(f.completion)} of full-time students finish a four-year degree within six years, ${compareWord(f.completion, s.median, 'rate')} the ${pct(s.median)} median.`
        : `${pct(f.completion)} of full-time students finish a four-year degree within six years.`,
    );
  }
  if (f.earnings10 !== null) {
    const s = p('earnings10');
    out.push(
      s
        ? `Ten years after enrolling, former students who are working earn a median of ${money(f.earnings10)}, ${compareWord(f.earnings10, s.median, 'amount')} the ${money(s.median)} median for similar schools.`
        : `Ten years after enrolling, former students who are working earn a median of ${money(f.earnings10)}.`,
    );
  }
  if (f.medianDebt !== null) {
    const s = p('medianDebt');
    out.push(
      s
        ? `Graduates leave with a median of ${money(f.medianDebt)} in federal student loans (similar-school median: ${money(s.median)}).`
        : `Graduates leave with a median of ${money(f.medianDebt)} in federal student loans.`,
    );
  }
  return out;
}

// ---------------------------------------------------------------------------
// Key metrics highlight
// ---------------------------------------------------------------------------

export interface Highlight {
  metric: PeerMetric;
  label: string;
  value: string;
  /** Similar-school median, formatted, when available. */
  peer: string | null;
  /** Glossary key for the info tooltip. */
  tip?: string;
}

export function highlights(f: SchoolFacts, peers: PeerMedians): Highlight[] {
  const rows: Array<[string, number | null, PeerMetric, (v: number) => string, string?]> = [
    ['Undergraduate enrollment', f.size, 'size', int],
    ['Average net price', f.netPrice, 'netPrice', money, 'avg-net-price'],
    ['Admit rate', f.admitRate, 'admitRate', pct, 'admit-rate'],
    ['Graduation rate (6 yrs)', f.completion, 'completion', pct, 'completion-4yr-150'],
    ['Median earnings (10 yrs)', f.earnings10, 'earnings10', money, 'earnings-10yr'],
    ['Median debt at graduation', f.medianDebt, 'medianDebt', money, 'student-debt'],
    ['First-year retention', f.retention, 'retention', pct, 'first-year-retention'],
  ];
  return rows
    .filter(([, v]) => v !== null)
    .map(([label, v, m, fmt, tip]) => {
      const s = peerStat(f, peers, m);
      return { metric: m, label, value: fmt(v as number), peer: s ? fmt(s.median) : null, tip };
    });
}

// ---------------------------------------------------------------------------
// Structured data (schema.org)
// ---------------------------------------------------------------------------

export function schoolJsonLd(f: SchoolFacts, pageUrl: string): Record<string, unknown> {
  const website = f.url ? (f.url.startsWith('http') ? f.url : `https://${f.url}`) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: f.name,
    url: pageUrl,
    ...(website ? { sameAs: website } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: f.city,
      addressRegion: f.state,
      addressCountry: 'US',
    },
  };
}
