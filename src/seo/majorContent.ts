/**
 * Major (field of study) pages: /majors and /majors/<slug>.
 *
 * Built from the College Scorecard's program-level data (CIP 4-digit codes), which
 * the build already downloads with each school's facts (scripts/fetch-school-data.ts).
 * Pages cover bachelor's degree programs. Program earnings are measured 1 and 5
 * years after graduation, unlike the school-level 10-years-after-entry figure.
 *
 * Summary numbers are medians across schools' program medians: each school counts
 * once. Voice: plain, sourced, neutral; no em dashes.
 */
import { slugify } from '../util/schoolUrl';
import { int, money } from './schoolContent';
import type { SchoolFacts } from './schoolContent';

export const SITE_URL = 'https://www.collegetrends.io';

/** Bachelor's degree. */
export const MAJOR_LEVEL = 3;
/** A major gets a page when at least this many schools report earnings for it. */
export const MIN_REPORTING = 10;

// ---------------------------------------------------------------------------
// Raw program records (one per school x program), cached by the build
// ---------------------------------------------------------------------------

export const PROGRAM_FIELDS = [
  'latest.programs.cip_4_digit.code',
  'latest.programs.cip_4_digit.earnings.1_yr.overall_median_earnings',
  'latest.programs.cip_4_digit.earnings.5_yr.overall_median_earnings',
  'latest.programs.cip_4_digit.debt.staff_grad_plus.all.all_inst.median',
] as const;

export interface ProgramRecord {
  schoolId: number;
  /** 4-digit CIP code, e.g. "1107" */
  cip: string;
  title: string;
  level: number;
  /** Awards in the most recent reported year. */
  awards: number | null;
  e1: number | null;
  e5: number | null;
  debt: number | null;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function cleanTitle(t: string): string {
  return t.replace(/\.\s*$/, '').trim();
}

/** Programs from one raw API row (requested with the cip_4_digit fields). */
export function programsFromApiRow(r: Record<string, unknown>): ProgramRecord[] {
  const raw = (r['latest.programs.cip_4_digit'] as Array<Record<string, any>>) ?? [];
  const out: ProgramRecord[] = [];
  for (const p of raw) {
    const level = num(p.credential?.level);
    const cip = typeof p.code === 'string' ? p.code : null;
    if (level !== MAJOR_LEVEL || !cip) continue;
    const rec: ProgramRecord = {
      schoolId: Number(r.id),
      cip,
      title: cleanTitle(String(p.title ?? '')),
      level,
      awards: num(p.counts?.ipeds_awards2),
      e1: num(p.earnings?.['1_yr']?.overall_median_earnings),
      e5: num(p.earnings?.['5_yr']?.overall_median_earnings),
      debt: num(p.debt?.staff_grad_plus?.all?.all_inst?.median),
    };
    // Skip programs with no graduates and no outcomes reported.
    if (!rec.awards && rec.e1 === null && rec.e5 === null && rec.debt === null) continue;
    out.push(rec);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rows per major: one per school offering it, shipped as /data/majors/<slug>.json
// ---------------------------------------------------------------------------

export interface MajorRow {
  id: number;
  /** Institution family: branch campuses share it and share earnings/debt figures. */
  ope6: string | null;
  name: string;
  city: string;
  state: string;
  ownership: number;
  /** Bachelor's degrees awarded in this major, most recent year. */
  awards: number | null;
  e1: number | null;
  e5: number | null;
  debt: number | null;
}

export interface MajorInfo {
  cip: string;
  slug: string;
  title: string;
}

export type MajorMetric = 'e1' | 'e5' | 'debt' | 'awards';

export interface MetricDef {
  key: MajorMetric;
  label: string;
  short: string;
  format: (v: number) => string;
  tick: (v: number) => string;
  tip: string;
}

const kMoney = (v: number) => (v === 0 ? '$0' : `$${Math.round(v / 1000)}k`);

export const MAJOR_METRICS: Record<MajorMetric, MetricDef> = {
  e1: {
    key: 'e1',
    label: 'Median earnings 1 year after graduation',
    short: 'Earnings, 1 yr',
    format: money,
    tick: kMoney,
    tip: 'Median earnings of graduates who received federal aid, 1 year after finishing, among those working and not enrolled.',
  },
  e5: {
    key: 'e5',
    label: 'Median earnings 5 years after graduation',
    short: 'Earnings, 5 yrs',
    format: money,
    tick: kMoney,
    tip: 'Median earnings of graduates who received federal aid, 5 years after finishing, among those working and not enrolled.',
  },
  debt: {
    key: 'debt',
    label: 'Median debt at graduation',
    short: 'Debt',
    format: money,
    tick: kMoney,
    tip: "Median federal student-loan balance of the program's graduates. Excludes Parent PLUS and private loans.",
  },
  awards: {
    key: 'awards',
    label: "Bachelor's degrees awarded per year",
    short: 'Graduates',
    format: int,
    tick: (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)),
    tip: "Bachelor's degrees the school awarded in this major in the most recent reported year.",
  },
};

export interface MajorData {
  majors: MajorInfo[];
  rows: Record<string, MajorRow[]>;
}

/** Group programs into majors; keep majors with enough schools reporting earnings. */
export function buildMajorData(facts: SchoolFacts[], programs: ProgramRecord[]): MajorData {
  const schools = new Map(facts.map((f) => [f.id, f]));
  const byCip = new Map<string, ProgramRecord[]>();
  for (const p of programs) {
    if (!schools.has(p.schoolId)) continue;
    (byCip.get(p.cip) ?? byCip.set(p.cip, []).get(p.cip)!).push(p);
  }

  const candidates: Array<{ cip: string; title: string; list: ProgramRecord[] }> = [];
  for (const [cip, list] of byCip) {
    // Count institutions, not campuses: branches repeat their institution's figures.
    const reporting = new Set(
      list
        .filter((p) => p.e1 !== null || p.e5 !== null)
        .map((p) => schools.get(p.schoolId)?.ope6 ?? `id${p.schoolId}`),
    ).size;
    if (reporting < MIN_REPORTING) continue;
    // Most common title for the code (titles are consistent, but be safe).
    const counts = new Map<string, number>();
    for (const p of list) counts.set(p.title, (counts.get(p.title) ?? 0) + 1);
    const title = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    candidates.push({ cip, title, list });
  }

  // Unique slugs: add the code when two titles slug the same.
  const slugCount = new Map<string, number>();
  for (const c of candidates) slugCount.set(slugify(c.title), (slugCount.get(slugify(c.title)) ?? 0) + 1);

  const majors: MajorInfo[] = [];
  const rows: Record<string, MajorRow[]> = {};
  for (const c of candidates.sort((a, b) => a.title.localeCompare(b.title))) {
    const base = slugify(c.title);
    const slug = (slugCount.get(base) ?? 0) > 1 ? `${base}-${c.cip}` : base;
    majors.push({ cip: c.cip, slug, title: c.title });
    // One row per school (a school can list a code once per level).
    const seen = new Set<number>();
    rows[slug] = c.list
      .filter((p) => !seen.has(p.schoolId) && seen.add(p.schoolId))
      .map((p) => {
        const f = schools.get(p.schoolId)!;
        return {
          id: f.id,
          ope6: f.ope6 ?? null,
          name: f.name,
          city: f.city,
          state: f.state,
          ownership: f.ownership,
          awards: p.awards,
          e1: p.e1,
          e5: p.e5,
          debt: p.debt,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
  }
  return { majors, rows };
}

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

export interface Stat {
  median: number;
  n: number;
}

export interface MajorSummary {
  schools: number;
  /** Sum of degrees awarded across schools reporting a count. */
  graduates: number;
  e1: Stat | null;
  e5: Stat | null;
  debt: Stat | null;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * One row per institution. The Scorecard reports program earnings and debt for a
 * whole institution (6-digit OPE ID), so its branch campuses carry identical
 * figures; counting each would weight a many-campus university several times.
 * Keeps the campus with the most graduates (usually the main campus).
 */
export function onePerInstitution(rows: MajorRow[]): Array<MajorRow & { campuses: number }> {
  const groups = new Map<string, MajorRow[]>();
  for (const r of rows) {
    const k = r.ope6 ?? `id${r.id}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  return [...groups.values()].map((g) => {
    const rep = [...g].sort((a, b) => (b.awards ?? 0) - (a.awards ?? 0) || a.id - b.id)[0];
    return { ...rep, campuses: g.length };
  });
}

function stat(units: MajorRow[], k: 'e1' | 'e5' | 'debt'): Stat | null {
  const vals = units.map((r) => r[k]).filter((v): v is number => v !== null);
  return vals.length ? { median: median(vals), n: vals.length } : null;
}

/** Campus counts and degrees are per campus; earnings and debt medians are per institution. */
export function summarizeMajor(rows: MajorRow[]): MajorSummary {
  const units = onePerInstitution(rows);
  return {
    schools: rows.length,
    graduates: rows.reduce((t, r) => t + (r.awards ?? 0), 0),
    e1: stat(units, 'e1'),
    e5: stat(units, 'e5'),
    debt: stat(units, 'debt'),
  };
}

export interface MajorIndexEntry extends MajorInfo {
  family: string;
  schools: number;
  graduates: number;
  e1: number | null;
  e5: number | null;
  debt: number | null;
  /** Institutions reporting 5-year earnings. */
  n5: number;
}

export function majorIndex(data: MajorData): MajorIndexEntry[] {
  return data.majors.map((m) => {
    const s = summarizeMajor(data.rows[m.slug] ?? []);
    return {
      ...m,
      family: familyName(m.cip),
      schools: s.schools,
      graduates: s.graduates,
      e1: s.e1?.median ?? null,
      e5: s.e5?.median ?? null,
      debt: s.debt?.median ?? null,
      n5: s.e5?.n ?? 0,
    };
  });
}

/** Top rows by a metric, among those reporting it (earnings and debt: one per institution). */
export function topRows(rows: MajorRow[], k: MajorMetric, n = 5): MajorRow[] {
  return (k === 'awards' ? rows : onePerInstitution(rows))
    .filter((r) => r[k] !== null)
    .sort((a, b) => (b[k] as number) - (a[k] as number))
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// CIP families (2-digit), for grouping and related links
// ---------------------------------------------------------------------------

const FAMILIES: Record<string, string> = {
  '01': 'Agriculture',
  '03': 'Natural resources and conservation',
  '04': 'Architecture',
  '05': 'Area, ethnic, cultural and gender studies',
  '09': 'Communication and journalism',
  '10': 'Communications technologies',
  '11': 'Computer and information sciences',
  '12': 'Personal and culinary services',
  '13': 'Education',
  '14': 'Engineering',
  '15': 'Engineering technologies',
  '16': 'Languages and linguistics',
  '19': 'Family and consumer sciences',
  '22': 'Legal studies',
  '23': 'English language and literature',
  '24': 'Liberal arts and humanities',
  '25': 'Library science',
  '26': 'Biological and biomedical sciences',
  '27': 'Mathematics and statistics',
  '29': 'Military technologies',
  '30': 'Interdisciplinary studies',
  '31': 'Parks, recreation and fitness',
  '38': 'Philosophy and religious studies',
  '39': 'Theology and religious vocations',
  '40': 'Physical sciences',
  '41': 'Science technologies',
  '42': 'Psychology',
  '43': 'Homeland security, law enforcement and firefighting',
  '44': 'Public administration and social services',
  '45': 'Social sciences',
  '46': 'Construction trades',
  '47': 'Mechanic and repair technologies',
  '48': 'Precision production',
  '49': 'Transportation',
  '50': 'Visual and performing arts',
  '51': 'Health professions',
  '52': 'Business and management',
  '54': 'History',
};

export function familyName(cip: string): string {
  return FAMILIES[cip.slice(0, 2)] ?? 'Other fields';
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export function majorPath(slug?: string): string {
  return slug ? `/majors/${slug}` : '/majors';
}

export const schoolPath = (r: Pick<MajorRow, 'id' | 'name'>) => `/school/${slugify(r.name)}-${r.id}`;

function nameList(rows: MajorRow[], k: MajorMetric): string {
  const items = rows.map((r) => `${r.name} (${MAJOR_METRICS[k].format(r[k] as number)})`);
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function majorIntro(m: MajorInfo, s: MajorSummary): string[] {
  const out: string[] = [];
  out.push(
    `The College Scorecard lists ${int(s.schools)} colleges that award bachelor's degrees in ${m.title}${
      s.graduates > 0 ? `, together awarding ${int(s.graduates)} of these degrees in the most recent year` : ''
    }.`,
  );
  if (s.e5) {
    out.push(
      s.e1
        ? `At the median institution, graduates who received federal aid earn ${money(s.e1.median)} one year after finishing and ${money(
            s.e5.median,
          )} five years after finishing (two separate graduating classes).`
        : `At the median institution, graduates who received federal aid earn ${money(s.e5.median)} five years after finishing.`,
    );
  } else if (s.e1) {
    out.push(`At the median institution, graduates who received federal aid earn ${money(s.e1.median)} one year after finishing.`);
  }
  if (s.debt) {
    out.push(`The median institution's graduates leave with ${money(s.debt.median)} in federal student loans.`);
  }
  return out;
}

export interface QuickFact {
  q: string;
  a: string;
}

export function majorQuickFacts(m: MajorInfo, rows: MajorRow[], s: MajorSummary): QuickFact[] {
  const t = m.title;
  const out: QuickFact[] = [];
  out.push({
    q: `How many colleges offer a bachelor's degree in ${t}?`,
    a: `The College Scorecard lists ${int(s.schools)} colleges that award bachelor's degrees in ${t}.`,
  });
  if (s.e5 || s.e1) {
    const parts: string[] = [];
    if (s.e1) parts.push(`${money(s.e1.median)} one year after graduation (${int(s.e1.n)} institutions reporting)`);
    if (s.e5) parts.push(`${money(s.e5.median)} five years after graduation (${int(s.e5.n)} institutions reporting)`);
    out.push({
      q: `How much do ${t} graduates earn?`,
      a: `Across institutions, the median of graduates' median earnings is ${parts.join(' and ')}. These figures cover graduates who received federal aid and are working and not enrolled in school. Branch campuses share their institution's figures, so each institution counts once.`,
    });
  }
  const top5 = topRows(rows, 'e5', 5);
  if (top5.length >= 3) {
    out.push({
      q: `Where do ${t} graduates earn the most five years after graduation?`,
      a: `By reported median earnings five years after graduation: ${nameList(top5, 'e5')}.`,
    });
  }
  if (s.debt) {
    out.push({
      q: `How much student debt do ${t} graduates have?`,
      a: `The median institution's ${t} graduates leave with ${money(s.debt.median)} in federal student loans (${int(
        s.debt.n,
      )} institutions reporting). Parent PLUS and private loans are not included.`,
    });
  }
  const big = topRows(rows, 'awards', 5);
  if (big.length >= 3) {
    out.push({
      q: `Which colleges award the most ${t} degrees?`,
      a: `By bachelor's degrees awarded in the most recent year: ${nameList(big, 'awards')}.`,
    });
  }
  return out;
}

// Hub
export function hubQuickFacts(index: MajorIndexEntry[]): QuickFact[] {
  const ranked = index.filter((m) => m.e5 !== null && m.n5 >= MIN_REPORTING).sort((a, b) => b.e5! - a.e5!);
  const top = ranked.slice(0, 10);
  const out: QuickFact[] = [];
  if (top.length) {
    out.push({
      q: 'Which college majors have the highest earnings?',
      a: `By the median of institutions' median earnings five years after graduation (majors with at least ${MIN_REPORTING} institutions reporting): ${top
        .map((m) => `${m.title} (${money(m.e5!)})`)
        .join(', ')}.`,
    });
  }
  out.push({
    q: 'Where do these earnings figures come from?',
    a: "The U.S. Department of Education's College Scorecard, which links federal financial aid records to tax data. Figures cover bachelor's graduates who received federal aid, measured one and five years after they finished, among those working and not enrolled in school.",
  });
  return out;
}

// ---------------------------------------------------------------------------
// Titles, meta, structured data
// ---------------------------------------------------------------------------

const TITLE_MAX = 65;
const META_MAX = 160;

export function majorTitle(m: MajorInfo, s: MajorSummary): string {
  const n = int(s.schools);
  const options = [
    `${m.title} Degree: Earnings & Debt at ${n} Colleges | College Trends`,
    `${m.title}: Earnings & Debt by College | College Trends`,
    `${m.title} Earnings by College | College Trends`,
    `${m.title} | College Trends`,
  ];
  return options.find((o) => o.length <= TITLE_MAX) ?? options[options.length - 1];
}

export function majorMeta(m: MajorInfo, s: MajorSummary): string {
  const parts: string[] = [];
  if (s.e5) parts.push(`median earnings ${money(s.e5.median)} after 5 years`);
  if (s.debt) parts.push(`median debt ${money(s.debt.median)}`);
  const head = `Compare ${m.title} bachelor's degrees at ${int(s.schools)} colleges`;
  for (let k = parts.length; k >= 0; k--) {
    const text = `${head}${k ? `: ${parts.slice(0, k).join(', ')}` : ''}. College Scorecard data.`;
    if (text.length <= META_MAX) return text;
  }
  return `${head}.`;
}

export const MAJORS_HUB_TITLE = 'College Majors Compared: Earnings & Debt by Major | College Trends';
export const MAJORS_HUB_META =
  "Earnings 1 and 5 years after graduation and student debt for every bachelor's major, from the federal College Scorecard. Compare one major across hundreds of colleges.";

export function majorJsonLd(
  m: MajorInfo,
  rows: MajorRow[],
  facts: QuickFact[],
  title: string,
  description: string,
): Record<string, unknown> {
  const url = SITE_URL + majorPath(m.slug);
  const byGrads = [...rows].sort((a, b) => (b.awards ?? 0) - (a.awards ?? 0)).slice(0, 100);
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
        about: `${m.title} bachelor's degrees (CIP ${m.cip.slice(0, 2)}.${m.cip.slice(2)})`,
        citation: 'U.S. Department of Education College Scorecard',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: rows.length,
          itemListElement: byGrads.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: r.name,
            url: SITE_URL + schoolPath(r),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Majors', item: SITE_URL + majorPath() },
          { '@type': 'ListItem', position: 2, name: m.title, item: url },
        ],
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
