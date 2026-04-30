/**
 * Build-time static page generator.
 *
 * Runs after `vite build` and produces:
 *   1. dist/sitemap.xml      — static + per-school URLs for Google
 *   2. dist/school/<slug>-<id>/index.html — per-school HTML stubs whose
 *      <head> meta block (title, description, og:*, twitter:*) is
 *      customized to that school. The page body is identical to the
 *      root index.html, so React hydrates the same SPA on load. The
 *      meta tags exist solely so social crawlers (iMessage, Slack,
 *      Twitter, LinkedIn, Discord, Facebook) — which don't run JS —
 *      see school-specific previews.
 *
 * Reads VITE_SCORECARD_API_KEY from the environment. On Vercel this comes
 * from the project's Environment Variables. Locally we also read .env so
 * `npm run build` works without prefixing.
 *
 * If the key isn't available (or the API call fails), we fall back to a
 * static-only sitemap and skip per-school HTML so the build never breaks.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { slugify } from '../src/util/schoolUrl';

// ---------------------------------------------------------------------------
// Mini dotenv loader — avoids adding a dependency for one local convenience.
// Only sets vars that aren't already present in the environment (Vercel wins).
// ---------------------------------------------------------------------------
if (existsSync('.env')) {
  for (const raw of readFileSync('.env', 'utf8').split('\n')) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const [, key, valueRaw] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = valueRaw.trim().replace(/^["']|["']$/g, '');
  }
}

const SITE_URL = 'https://www.collegetrends.io';
const API_KEY = process.env.VITE_SCORECARD_API_KEY;
const SCORECARD_BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const PER_PAGE = 100;
const CONCURRENCY = 5;

const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/app', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
];

interface School {
  id: number;
  name: string;
}

interface ApiResponse {
  metadata: { total: number; page: number; per_page: number };
  results: Array<Record<string, unknown>>;
}

async function fetchSchoolPage(page: number): Promise<{ schools: School[]; total: number }> {
  const params = new URLSearchParams({
    api_key: API_KEY!,
    fields: 'id,school.name',
    // Only operating, degree-granting institutions — matches what app shows.
    'school.operating': '1',
    'school.degrees_awarded.predominant': '1,2,3,4',
    per_page: String(PER_PAGE),
    page: String(page),
  });
  const res = await fetch(`${SCORECARD_BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Scorecard API ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const data = (await res.json()) as ApiResponse;
  const schools = data.results
    .map((r) => ({ id: Number(r.id), name: String(r['school.name'] ?? '') }))
    .filter((s) => Number.isFinite(s.id) && s.name.length > 0);
  return { schools, total: data.metadata.total };
}

async function fetchAllSchools(): Promise<School[]> {
  console.log('Fetching school list from College Scorecard…');
  const first = await fetchSchoolPage(0);
  const totalPages = Math.ceil(first.total / PER_PAGE);
  console.log(`  ${first.total} institutions across ${totalPages} pages`);

  const all: School[] = [...first.schools];
  const remaining: number[] = [];
  for (let p = 1; p < totalPages; p++) remaining.push(p);

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((p) => fetchSchoolPage(p)));
    for (const r of results) all.push(...r.schools);
    process.stdout.write(`\r  fetched ${all.length}/${first.total}    `);
  }
  process.stdout.write('\n');
  return all;
}

interface UrlEntry {
  loc: string;
  priority: string;
  changefreq: string;
}

function buildXml(urls: UrlEntry[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escape(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

// ---------------------------------------------------------------------------
// Per-school HTML generation
// ---------------------------------------------------------------------------

/** HTML-escape user-supplied strings before they go into attributes. */
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Build the school-specific <head> meta block (between meta:start/meta:end). */
function renderSchoolMeta(school: School): string {
  const url = `${SITE_URL}/school/${slugify(school.name)}-${school.id}`;
  const ogImage = `${SITE_URL}/api/og?id=${school.id}`;
  const title = htmlEscape(`${school.name} — College Trends`);
  const description = htmlEscape(
    `Federal data on ${school.name}: net price, earnings, debt, completion, demographics, admissions. From the U.S. Department of Education's College Scorecard.`,
  );
  const altText = htmlEscape(`${school.name} — College Trends`);

  return `<!-- meta:start (per-school, generated) -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="College Trends" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${altText}" />

    <!-- Twitter / X card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
    <!-- meta:end -->`;
}

const META_BLOCK_REGEX = /<!-- meta:start[\s\S]*?meta:end -->/;

function generateSchoolHtml(template: string, schools: School[]): number {
  if (!META_BLOCK_REGEX.test(template)) {
    console.error(
      '✗ dist/index.html is missing the <!-- meta:start --> ... <!-- meta:end --> markers; ' +
        'per-school HTML generation skipped. (Did index.html get edited without preserving them?)',
    );
    return 0;
  }
  let written = 0;
  for (const school of schools) {
    const slug = slugify(school.name);
    if (!slug) continue;
    const path = `dist/school/${slug}-${school.id}/index.html`;
    const html = template.replace(META_BLOCK_REGEX, renderSchoolMeta(school));
    const out = resolve(path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }
  return written;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const urls: UrlEntry[] = STATIC_PAGES.map((p) => ({
    loc: SITE_URL + p.path,
    priority: p.priority,
    changefreq: p.changefreq,
  }));

  let schools: School[] = [];

  if (!API_KEY || API_KEY === 'your_api_data_gov_key_here') {
    console.warn(
      'No VITE_SCORECARD_API_KEY in env — sitemap will include static pages only, ' +
        'per-school HTML generation skipped.',
    );
  } else {
    try {
      schools = await fetchAllSchools();
      for (const s of schools) {
        urls.push({
          loc: `${SITE_URL}/school/${slugify(s.name)}-${s.id}`,
          priority: '0.7',
          changefreq: 'monthly',
        });
      }
    } catch (err) {
      console.error(
        'Failed to fetch schools — sitemap will include static pages only, ' +
          'per-school HTML skipped:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 1. Sitemap
  const sitemapOut = resolve('dist/sitemap.xml');
  writeFileSync(sitemapOut, buildXml(urls));
  console.log(`✓ Wrote ${sitemapOut} (${urls.length} URLs)`);

  // 2. Per-school HTML
  if (schools.length > 0) {
    const templatePath = resolve('dist/index.html');
    if (!existsSync(templatePath)) {
      console.error(`✗ Missing ${templatePath}; did vite build run first?`);
      return;
    }
    const template = readFileSync(templatePath, 'utf8');
    const written = generateSchoolHtml(template, schools);
    console.log(`✓ Wrote ${written} per-school HTML files (dist/school/<slug>-<id>/index.html)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
