/**
 * Daily College Scorecard data check (run by .github/workflows/data-updates.yml).
 *
 * The Scorecard API has no "last updated" date, so we measure it:
 *   1. Fetch the tracked fields (src/util/dataVintage.ts DATA_FAMILIES) for every
 *      school the app lists, about 60 requests.
 *   2. Hash each school's values per field family and compare with yesterday's
 *      hashes in data/scorecard-fingerprint.json: how many schools changed per
 *      family, and how many schools were added or removed.
 *   3. Find which yearly data file each family's `latest` values come from
 *      (src/data/dataVintages.json, shown under "How recent is this data?").
 *   4. Read the Department's change log page for new dated entries.
 *
 * Anything new becomes an entry in src/data/dataUpdates.json (shown on /changelog).
 * The workflow commits the changed files, which redeploys the site.
 *
 * First run (no fingerprint yet): writes the baseline and backfills the
 * Department's change log entries since BACKFILL_FROM as history.
 *
 * Reads SCORECARD_API_KEY or VITE_SCORECARD_API_KEY (env or local .env).
 * Exits non-zero without writing anything if the API fetch fails.
 */
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { DATA_FAMILIES, yearLabel } from '../src/util/dataVintage';
import type { DataUpdate } from '../src/data/dataUpdates';

// Mini dotenv loader: only sets vars that aren't already present.
if (existsSync('.env')) {
  for (const raw of readFileSync('.env', 'utf8').split('\n')) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const [, key, valueRaw] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = valueRaw.trim().replace(/^["']|["']$/g, '');
  }
}

const API_KEY = process.env.SCORECARD_API_KEY || process.env.VITE_SCORECARD_API_KEY;
const SCORECARD_BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const CHANGELOG_URL = 'https://collegescorecard.ed.gov/data/changelog/';
const PER_PAGE = 100;
const CONCURRENCY = 2;
const BACKFILL_FROM = '2024-01-01';
/** How many yearly files back to look when finding a family's data year. */
const YEAR_WINDOW = 10;

const FINGERPRINT_PATH = resolve('data/scorecard-fingerprint.json');
const VINTAGES_PATH = resolve('src/data/dataVintages.json');
const UPDATES_PATH = resolve('src/data/dataUpdates.json');

const today = new Date().toISOString().slice(0, 10);
const thisYear = new Date().getUTCFullYear();
const YEARS = Array.from({ length: YEAR_WINDOW }, (_, i) => thisYear - i);

type Row = Record<string, unknown>;

interface Fingerprint {
  families: string[];
  /** School id → concatenated 8-char hashes, one per family, in `families` order. */
  schools: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Scorecard API
// ---------------------------------------------------------------------------

const FIELDS = [
  'id',
  ...DATA_FAMILIES.flatMap((f) => f.fields.map((p) => `latest.${p}`)),
  ...DATA_FAMILIES.flatMap((f) => YEARS.map((y) => `${y}.${f.fields[0]}`)),
];

async function fetchPage(page: number, attempt = 1): Promise<{ total: number; results: Row[] }> {
  const params = new URLSearchParams({
    api_key: API_KEY!,
    fields: FIELDS.join(','),
    // Same school set as the app and the build (scripts/fetch-school-data.ts).
    'school.operating': '1',
    'school.degrees_awarded.predominant': '1,2,3,4',
    per_page: String(PER_PAGE),
    page: String(page),
  });
  const res = await fetch(`${SCORECARD_BASE}?${params.toString()}`);
  if (!res.ok) {
    if (attempt < 4 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return fetchPage(page, attempt + 1);
    }
    throw new Error(`Scorecard API ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`);
  }
  const body = (await res.json()) as { metadata: { total: number }; results: Row[] };
  return { total: body.metadata.total, results: body.results };
}

async function fetchAllRows(): Promise<Row[]> {
  const first = await fetchPage(0);
  const totalPages = Math.ceil(first.total / PER_PAGE);
  const rows = [...first.results];
  for (let p = 1; p < totalPages; p += CONCURRENCY) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, totalPages - p) }, (_, i) => p + i);
    for (const pg of await Promise.all(batch.map((n) => fetchPage(n)))) rows.push(...pg.results);
  }
  if (rows.length < first.total * 0.98) {
    throw new Error(`Only fetched ${rows.length} of ${first.total} schools`);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

function fingerprint(rows: Row[]): Fingerprint {
  const schools: Record<string, string> = {};
  for (const r of rows) {
    const id = String(r.id);
    schools[id] = DATA_FAMILIES.map((f) =>
      createHash('sha1')
        .update(JSON.stringify(f.fields.map((p) => r[`latest.${p}`] ?? null)))
        .digest('hex')
        .slice(0, 8),
    ).join('');
  }
  return { families: DATA_FAMILIES.map((f) => f.key), schools };
}

/**
 * The yearly file a family's `latest` values come from: the earliest year whose
 * values match `latest` for nearly as many schools as the best-matching year.
 * Earliest, because the Department sometimes carries a value forward into later
 * files unchanged; the first file it appears in is when it was measured.
 */
function dataYears(rows: Row[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of DATA_FAMILIES) {
    const field = f.fields[0];
    const counts = YEARS.map((y) => {
      let n = 0;
      for (const r of rows) {
        const latest = r[`latest.${field}`];
        if (latest !== null && latest !== undefined && r[`${y}.${field}`] === latest) n++;
      }
      return { y, n };
    });
    const best = Math.max(...counts.map((c) => c.n));
    if (best === 0) continue;
    out[f.key] = Math.min(...counts.filter((c) => c.n >= best * 0.9).map((c) => c.y));
  }
  return out;
}

function compare(prev: Fingerprint, next: Fingerprint) {
  const changedByFamily: Record<string, number> = {};
  let added = 0;
  let removed = 0;
  const prevIndex = new Map(prev.families.map((k, i) => [k, i]));
  for (const [id, hashes] of Object.entries(next.schools)) {
    const old = prev.schools[id];
    if (old === undefined) {
      added++;
      continue;
    }
    next.families.forEach((k, i) => {
      const j = prevIndex.get(k);
      if (j === undefined) return; // family added since last run: no baseline yet
      if (old.slice(j * 8, j * 8 + 8) !== hashes.slice(i * 8, i * 8 + 8)) {
        changedByFamily[k] = (changedByFamily[k] ?? 0) + 1;
      }
    });
  }
  for (const id of Object.keys(prev.schools)) if (next.schools[id] === undefined) removed++;
  return { changedByFamily, added, removed };
}

// ---------------------------------------------------------------------------
// Department of Education change log
// ---------------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toIso(d: string): string | null {
  const m = d.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[1]);
  if (mi < 0) return null;
  return `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;|&#x27;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s*—\s*/g, ', ') // site copy rule: no em dashes
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dated data releases from the change log, newest first. Never throws. */
async function officialEntries(): Promise<Array<{ date: string; summary: string }>> {
  try {
    const res = await fetch(CHANGELOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const heads = [...html.matchAll(/<span class="flex-1"[^>]*>(?:<!--\[-->)?\s*([A-Z][a-z]+ \d{1,2}, \d{4})\s*(?:<!--\]-->)?<\/span>/g)];
    const out: Array<{ date: string; summary: string }> = [];
    heads.forEach((h, i) => {
      const date = toIso(h[1]);
      if (!date) return;
      const body = html.slice(h.index!, heads[i + 1]?.index ?? html.length);
      // Paragraphs and lists in order; a list becomes "a, b, c."
      const blocks = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>|<ul[^>]*>([\s\S]*?)<\/ul>/g)].map((m) =>
        m[1] !== undefined
          ? cleanText(m[1])
          : [...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((li) => cleanText(li[1]).replace(/\.$/, '')).join(', ') + '.',
      );
      let summary = blocks[0] ?? '';
      // "...as indicated below." / "...include:" : carry on into what follows.
      for (let b = 1; b < blocks.length && /(:|below\.)$/.test(summary); b++) summary += ` ${blocks[b]}`;
      summary = summary.replace(/:,\s*/g, ': ').replace(/([^.!?])$/, '$1.');
      // Only releases that changed data (the log also covers website-only changes).
      const isData =
        /more recent data|data files|the API|College Scorecard data/i.test(summary) &&
        !/were not updated/i.test(summary);
      if (isData) out.push({ date, summary });
    });
    if (out.length === 0) console.warn('Change log parsed with no entries; page layout may have changed.');
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch (err) {
    console.warn(`Could not read the Department change log: ${(err as Error).message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback;
}

function writeFingerprint(fp: Fingerprint) {
  mkdirSync(dirname(FINGERPRINT_PATH), { recursive: true });
  // One school per line so git diffs stay readable.
  const ids = Object.keys(fp.schools).sort((a, b) => Number(a) - Number(b));
  const lines = ids.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(fp.schools[id])}`);
  writeFileSync(
    FINGERPRINT_PATH,
    `{\n  "families": ${JSON.stringify(fp.families)},\n  "schools": {\n${lines.join(',\n')}\n  }\n}\n`,
  );
}

async function main() {
  if (!API_KEY || API_KEY === 'your_api_data_gov_key_here') {
    console.error('No SCORECARD_API_KEY or VITE_SCORECARD_API_KEY set.');
    process.exit(1);
  }

  if (process.argv.includes('--history-only')) {
    // Rebuild the change-log history entries without calling the API.
    const official = await officialEntries();
    const updates = readJson<DataUpdate[]>(UPDATES_PATH, []).filter((u) => u.measured);
    const attached = new Set(updates.map((u) => u.official?.date));
    for (const o of official) {
      if (o.date < BACKFILL_FROM || attached.has(o.date)) continue;
      updates.push({ date: o.date, measured: false, official: o, changes: [], schoolsAdded: 0, schoolsRemoved: 0 });
    }
    updates.sort((a, b) => (a.date < b.date ? 1 : -1));
    writeFileSync(UPDATES_PATH, JSON.stringify(updates, null, 2) + '\n');
    console.log(`History rebuilt: ${updates.length} entries.`);
    return;
  }

  const rows = await fetchAllRows();
  const next = fingerprint(rows);
  const years = dataYears(rows);
  const official = await officialEntries();
  const updates = readJson<DataUpdate[]>(UPDATES_PATH, []);
  const prevYears = readJson<{ years: Record<string, number> }>(VINTAGES_PATH, { years: {} }).years;
  const label = (key: string) => DATA_FAMILIES.find((f) => f.key === key)?.label ?? key;

  if (!existsSync(FINGERPRINT_PATH)) {
    // Baseline: record history from the Department's log, nothing measured yet.
    const known = new Set(updates.map((u) => u.official?.date));
    for (const o of official) {
      if (o.date < BACKFILL_FROM || known.has(o.date)) continue;
      updates.push({ date: o.date, measured: false, official: o, changes: [], schoolsAdded: 0, schoolsRemoved: 0 });
    }
    console.log(`Baseline: ${rows.length} schools; ${updates.length} history entries.`);
  } else {
    const prev = readJson<Fingerprint>(FINGERPRINT_PATH, { families: [], schools: {} });
    const { changedByFamily, added, removed } = compare(prev, next);
    const latestKnown = updates.reduce((m, u) => (u.official && u.official.date > m ? u.official.date : m), BACKFILL_FROM);
    const newOfficial = official.filter((o) => o.date > latestKnown);

    const changes = DATA_FAMILIES.filter((f) => changedByFamily[f.key]).map((f) => ({
      family: label(f.key),
      schools: changedByFamily[f.key],
      year: years[f.key] ? yearLabel(years[f.key]) : null,
      previousYear: prevYears[f.key] ? yearLabel(prevYears[f.key]) : null,
    }));

    // Older new log entries (rare: several releases between runs) become history.
    for (const o of newOfficial.slice(1)) {
      updates.push({ date: o.date, measured: false, official: o, changes: [], schoolsAdded: 0, schoolsRemoved: 0 });
    }

    if (changes.length || added || removed || newOfficial.length) {
      const entry: DataUpdate = {
        date: today,
        measured: true,
        ...(newOfficial[0] ? { official: newOfficial[0] } : {}),
        changes,
        schoolsAdded: added,
        schoolsRemoved: removed,
      };
      const i = updates.findIndex((u) => u.date === today && u.measured);
      if (i >= 0) updates[i] = entry; // re-run on the same day replaces it
      else updates.push(entry);
      console.log('Data update recorded:', JSON.stringify(entry, null, 2));
    } else {
      console.log(`No changes across ${rows.length} schools.`);
    }
  }

  updates.sort((a, b) => (a.date < b.date ? 1 : -1));
  writeFingerprint(next);
  writeFileSync(VINTAGES_PATH, JSON.stringify({ years }, null, 2) + '\n');
  writeFileSync(UPDATES_PATH, JSON.stringify(updates, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
