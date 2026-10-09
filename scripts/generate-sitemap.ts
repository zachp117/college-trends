/**
 * Build step 3 (runs after `vite build`): static pages for crawlers.
 *
 * Reads .cache/school-facts.json (written by scripts/fetch-school-data.ts) and
 * produces:
 *   1. dist/sitemap.xml: static + per-school URLs.
 *   2. dist/school/<slug>-<id>/index.html: per-school HTML whose <head> carries
 *      a school-specific title, meta description, canonical, Open Graph, Twitter
 *      and schema.org JSON-LD, and whose #root is pre-filled with the school's
 *      intro (H1, description, key metrics, data overview) rendered from the same
 *      React component the SPA uses. Crawlers that don't run JS see real content;
 *      in a browser, React mounts and replaces it with the full interactive page.
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

const SITE_URL = 'https://www.collegetrends.io';
const FACTS_CACHE = resolve('.cache/school-facts.json');
const PEERS_PATH = resolve('src/data/peerMedians.json');

const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/app', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
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
    const peers = JSON.parse(readFileSync(PEERS_PATH, 'utf8')) as PeerMedians;
    const written = generateSchoolHtml(template, schools, peers);
    console.log(`✓ Wrote ${written} per-school HTML files (dist/school/<slug>-<id>/index.html)`);
  }
}

main();
