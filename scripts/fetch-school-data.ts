/**
 * Build step 1 (runs before `vite build`): fetch every school's facts once.
 *
 * Writes:
 *   - .cache/school-facts.json: SchoolFacts[] for scripts/generate-sitemap.ts
 *     (per-school title/meta, static body content, sitemap URLs).
 *   - src/data/schoolNameCollisions.json: names shared by several schools, so
 *     their title tags can add the city and state.
 *   - src/data/peerMedians.json: national medians per peer group (ownership x
 *     predominant degree). Bundled into the SPA, so the live page and the static
 *     HTML quote the same comparisons. Committed, so dev and key-less builds work.
 *
 * Reads VITE_SCORECARD_API_KEY (Vercel env, or local .env). Without a key, or if
 * the API fails, it exits cleanly: the sitemap step falls back to static-only and
 * the committed peerMedians.json is kept. The build never breaks on this step.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  FACT_FIELDS,
  computePeerMedians,
  factsFromApiRow,
  nameCollisions,
  type SchoolFacts,
} from '../src/seo/schoolContent';

// Mini dotenv loader: only sets vars that aren't already present (Vercel wins).
if (existsSync('.env')) {
  for (const raw of readFileSync('.env', 'utf8').split('\n')) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const [, key, valueRaw] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = valueRaw.trim().replace(/^["']|["']$/g, '');
  }
}

const API_KEY = process.env.VITE_SCORECARD_API_KEY;
const SCORECARD_BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const PER_PAGE = 100;
const CONCURRENCY = 5;
const FACTS_CACHE = resolve('.cache/school-facts.json');
const PEERS_OUT = resolve('src/data/peerMedians.json');
const COLLISIONS_OUT = resolve('src/data/schoolNameCollisions.json');

interface ApiResponse {
  metadata: { total: number; page: number; per_page: number };
  results: Array<Record<string, unknown>>;
}

async function fetchPage(page: number, attempt = 1): Promise<ApiResponse> {
  const params = new URLSearchParams({
    api_key: API_KEY!,
    fields: FACT_FIELDS.join(','),
    // Only operating, degree-granting institutions, matching what the app shows.
    'school.operating': '1',
    'school.degrees_awarded.predominant': '1,2,3,4',
    per_page: String(PER_PAGE),
    page: String(page),
  });
  const res = await fetch(`${SCORECARD_BASE}?${params.toString()}`);
  if (!res.ok) {
    if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return fetchPage(page, attempt + 1);
    }
    throw new Error(`Scorecard API ${res.status}: ${await res.text().catch(() => '')}`);
  }
  return (await res.json()) as ApiResponse;
}

async function fetchAllFacts(): Promise<SchoolFacts[]> {
  console.log('Fetching school facts from College Scorecard…');
  const first = await fetchPage(0);
  const totalPages = Math.ceil(first.metadata.total / PER_PAGE);
  const rows = [...first.results];
  for (let p = 1; p < totalPages; p += CONCURRENCY) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, totalPages - p) }, (_, i) => p + i);
    const pages = await Promise.all(batch.map((n) => fetchPage(n)));
    for (const pg of pages) rows.push(...pg.results);
    process.stdout.write(`\r  fetched ${rows.length}/${first.metadata.total}    `);
  }
  process.stdout.write('\n');
  return rows
    .map(factsFromApiRow)
    .filter((f) => Number.isFinite(f.id) && f.name.length > 0);
}

async function main() {
  if (!API_KEY || API_KEY === 'your_api_data_gov_key_here') {
    console.warn('No VITE_SCORECARD_API_KEY; skipping school facts (static-only sitemap, committed peer medians).');
    return;
  }
  try {
    const facts = await fetchAllFacts();
    mkdirSync(resolve('.cache'), { recursive: true });
    writeFileSync(FACTS_CACHE, JSON.stringify(facts));
    writeFileSync(PEERS_OUT, JSON.stringify(computePeerMedians(facts), null, 2) + '\n');
    writeFileSync(COLLISIONS_OUT, JSON.stringify(nameCollisions(facts), null, 2) + '\n');
    console.log(`✓ ${facts.length} school facts cached; peer medians written to src/data/peerMedians.json`);
  } catch (err) {
    console.warn(`Failed to fetch school facts; keeping committed peer medians. ${(err as Error).message}`);
  }
}

main();
