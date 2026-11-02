/**
 * Build step 3 (runs after `vite build`): static pages for crawlers.
 *
 * Reads .cache/school-facts.json (written by scripts/fetch-school-data.ts) and
 * produces:
 *   1. dist/sitemap.xml: static, per-school and /colleges URLs.
 *   2. dist/school/<slug>-<id>/index.html: per-school HTML whose <head> carries
 *      a school-specific title, meta description, canonical, Open Graph, Twitter
 *      and schema.org JSON-LD, and whose #root is pre-filled with the school's
 *      intro (H1, description, key metrics, data overview) rendered from the same
 *      React component the SPA uses. Crawlers that don't run JS see real content;
 *      in a browser, React mounts and replaces it with the full interactive page.
 *   3. dist/colleges/index.html, dist/colleges/<collection>/index.html and
 *      dist/colleges/<collection>/<state>/index.html: the /colleges pages, pre-rendered
 *      from the same React components the SPA uses (chart placeholder, first 50 rows).
 *   4. dist/majors/index.html and dist/majors/<slug>/index.html, from .cache/programs.json.
 *
 * If the facts cache is missing (no API key, or the fetch failed), the build still
 * succeeds with a static-only sitemap and no per-school HTML.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { slugify } from '../src/util/schoolUrl';
import {
  metaDescription,
  schoolJsonLd,
  titleTag,
  type PeerMedians,
  type SchoolFacts,
} from '../src/seo/schoolContent';
import { SchoolIntro } from '../src/components/SchoolIntro';
import { CollectionPage } from '../src/components/collections/CollectionPage';
import { CollectionsHub } from '../src/components/collections/CollectionsHub';
import { COLLECTIONS, collectionPath } from '../src/data/collections';
import {
  HUB_META,
  HUB_TITLE,
  buildCollectionData,
  collectionJsonLd,
  collectionMeta,
  collectionTitle,
  hubSummary,
  quickFacts,
  summarize,
} from '../src/seo/collectionContent';
import { stateName } from '../src/seo/schoolContent';
import { MajorPage } from '../src/components/majors/MajorPage';
import { MajorsHub } from '../src/components/majors/MajorsHub';
import {
  MAJORS_HUB_META,
  MAJORS_HUB_TITLE,
  buildMajorData,
  majorIndex,
  majorJsonLd,
  majorMeta,
  majorPath,
  majorQuickFacts,
  majorTitle,
  summarizeMajor,
  type ProgramRecord,
} from '../src/seo/majorContent';

const SITE_URL = 'https://www.collegetrends.io';
const FACTS_CACHE = resolve('.cache/school-facts.json');
const PEERS_PATH = resolve('src/data/peerMedians.json');

const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/app', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/colleges', priority: '0.8', changefreq: 'monthly' },
];

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

/** HTML-escape strings before they go into attributes or text. */
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const schoolUrl = (f: SchoolFacts) => `${SITE_URL}/school/${slugify(f.name)}-${f.id}`;

/** Build the school-specific <head> meta block (between meta:start/meta:end). */
function renderSchoolMeta(f: SchoolFacts): string {
  const url = schoolUrl(f);
  const ogImage = `${SITE_URL}/api/og?id=${f.id}`;
  const title = htmlEscape(titleTag(f));
  const description = htmlEscape(metaDescription(f));
  // JSON in a <script>: escape "<" so a name can never close the tag.
  const jsonLd = JSON.stringify(schoolJsonLd(f, url)).replace(/</g, '\\u003c');

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
    <meta property="og:image:alt" content="${title}" />

    <!-- Twitter / X card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />

    <!-- Structured data -->
    <script type="application/ld+json">${jsonLd}</script>
    <!-- meta:end -->`;
}

/** Static body: the same SchoolIntro the SPA renders, inside the app's main container. */
function renderSchoolBody(f: SchoolFacts, peers: PeerMedians): string {
  const intro = renderToStaticMarkup(createElement(SchoolIntro, { facts: f, peers }));
  return `<div id="root"><main class="max-w-7xl mx-auto px-4 sm:px-6 py-8"><div class="space-y-6">${intro}</div></main></div>`;
}

const META_BLOCK_REGEX = /<!-- meta:start[\s\S]*?meta:end -->/;
const ROOT_REGEX = /<div id="root"><\/div>/;

function generateSchoolHtml(template: string, schools: SchoolFacts[], peers: PeerMedians): number {
  if (!META_BLOCK_REGEX.test(template) || !ROOT_REGEX.test(template)) {
    console.error(
      '✗ dist/index.html is missing the <!-- meta:start --> ... <!-- meta:end --> markers or ' +
        'an empty <div id="root"></div>; per-school HTML generation skipped.',
    );
    return 0;
  }
  let written = 0;
  for (const f of schools) {
    const slug = slugify(f.name);
    if (!slug) continue;
    const html = template
      .replace(META_BLOCK_REGEX, () => renderSchoolMeta(f))
      .replace(ROOT_REGEX, () => renderSchoolBody(f, peers));
    const out = resolve(`dist/school/${slug}-${f.id}/index.html`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }
  return written;
}

// ---------------------------------------------------------------------------
// /colleges pages
// ---------------------------------------------------------------------------

interface PageMeta {
  path: string;
  title: string;
  description: string;
  jsonLd?: Record<string, unknown>;
}

function renderPageMeta(m: PageMeta): string {
  const url = SITE_URL + m.path;
  const title = htmlEscape(m.title);
  const description = htmlEscape(m.description);
  const ogImage = `${SITE_URL}/og-image.png`;
  const jsonLd = m.jsonLd
    ? `\n    <script type="application/ld+json">${JSON.stringify(m.jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';
  return `<!-- meta:start (per-page, generated) -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="College Trends" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />${jsonLd}
    <!-- meta:end -->`;
}

function writePage(template: string, meta: PageMeta, body: string) {
  const html = template
    .replace(META_BLOCK_REGEX, () => renderPageMeta(meta))
    .replace(ROOT_REGEX, () => `<div id="root">${body}</div>`);
  const out = resolve(`dist${meta.path}/index.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

/** Write every /colleges page; returns their paths for the sitemap. */
function generateCollectionHtml(template: string, schools: SchoolFacts[]): string[] {
  const { rows, states } = buildCollectionData(schools);
  const paths: string[] = [];

  writePage(
    template,
    { path: collectionPath(), title: HUB_TITLE, description: HUB_META },
    renderToStaticMarkup(createElement(CollectionsHub, { summary: hubSummary(rows) })),
  );
  paths.push(collectionPath());

  for (const c of COLLECTIONS) {
    const all = rows[c.slug] ?? [];
    if (all.length === 0) continue;
    const places = [null, ...(states[c.slug] ?? []).map((code) => ({ code, name: stateName(code) }))];
    for (const state of places) {
      const local = state ? all.filter((r) => r.state === state.code) : all;
      const summary = summarize(local);
      const title = collectionTitle(c, state, summary.count);
      const description = collectionMeta(c, state, summary);
      const facts = quickFacts(c, state, local, summary);
      const path = collectionPath(c.slug, state?.code);
      writePage(
        template,
        { path, title, description, jsonLd: collectionJsonLd(c, state, local, facts, title, description) },
        renderToStaticMarkup(createElement(CollectionPage, { collection: c, state, rows: all })),
      );
      paths.push(path);
    }
  }
  return paths;
}

/** Write /majors and every /majors/<slug> page; returns their paths. */
function generateMajorHtml(template: string, schools: SchoolFacts[]): string[] {
  const cache = resolve('.cache/programs.json');
  if (!existsSync(cache)) return [];
  const data = buildMajorData(schools, JSON.parse(readFileSync(cache, 'utf8')) as ProgramRecord[]);
  const paths: string[] = [];
  writePage(
    template,
    { path: majorPath(), title: MAJORS_HUB_TITLE, description: MAJORS_HUB_META },
    renderToStaticMarkup(createElement(MajorsHub, { index: majorIndex(data) })),
  );
  paths.push(majorPath());
  for (const m of data.majors) {
    const rows = data.rows[m.slug] ?? [];
    const s = summarizeMajor(rows);
    const title = majorTitle(m, s);
    const description = majorMeta(m, s);
    const path = majorPath(m.slug);
    writePage(
      template,
      { path, title, description, jsonLd: majorJsonLd(m, rows, majorQuickFacts(m, rows, s), title, description) },
      renderToStaticMarkup(createElement(MajorPage, { major: m, rows })),
    );
    paths.push(path);
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const urls: UrlEntry[] = STATIC_PAGES.map((p) => ({
    loc: SITE_URL + p.path,
    priority: p.priority,
    changefreq: p.changefreq,
  }));

  let schools: SchoolFacts[] = [];
  if (existsSync(FACTS_CACHE)) {
    schools = JSON.parse(readFileSync(FACTS_CACHE, 'utf8')) as SchoolFacts[];
    for (const f of schools) {
      if (!slugify(f.name)) continue;
      urls.push({ loc: schoolUrl(f), priority: '0.7', changefreq: 'monthly' });
    }
  } else {
    console.warn('No .cache/school-facts.json; sitemap will include static pages only, per-school HTML skipped.');
  }

  // 1. Per-school and /colleges HTML (before the sitemap, which lists the /colleges pages)
  const templatePath = resolve('dist/index.html');
  if (schools.length > 0 && !existsSync(templatePath)) {
    console.error(`✗ Missing ${templatePath}; did vite build run first?`);
  } else if (schools.length > 0) {
    const template = readFileSync(templatePath, 'utf8');
    const peers = JSON.parse(readFileSync(PEERS_PATH, 'utf8')) as PeerMedians;
    const written = generateSchoolHtml(template, schools, peers);
    console.log(`✓ Wrote ${written} per-school HTML files (dist/school/<slug>-<id>/index.html)`);

    if (META_BLOCK_REGEX.test(template) && ROOT_REGEX.test(template)) {
      const collectionPaths = generateCollectionHtml(template, schools);
      // /colleges itself is already in STATIC_PAGES.
      for (const p of collectionPaths.filter((x) => x !== '/colleges')) {
        const isState = p.split('/').length > 3;
        urls.push({ loc: SITE_URL + p, priority: isState ? '0.7' : '0.8', changefreq: 'monthly' });
      }
      console.log(`✓ Wrote ${collectionPaths.length} /colleges pages`);

      const majorPaths = generateMajorHtml(template, schools);
      for (const p of majorPaths) {
        urls.push({ loc: SITE_URL + p, priority: p === '/majors' ? '0.8' : '0.7', changefreq: 'monthly' });
      }
      console.log(`✓ Wrote ${majorPaths.length} /majors pages`);
    }
  }

  // 2. Sitemap
  const sitemapOut = resolve('dist/sitemap.xml');
  writeFileSync(sitemapOut, buildXml(urls));
  console.log(`✓ Wrote ${sitemapOut} (${urls.length} URLs)`);
}

main();
