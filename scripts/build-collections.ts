/**
 * Build step 2 (runs after fetch-school-data, before `vite build`). No API calls.
 *
 * Reads .cache/school-facts.json and writes:
 *   - public/data/collections/<slug>.json: compact rows the /colleges pages load,
 *     plus index.json (one summary per collection, for the /colleges hub)
 *     (gitignored; vite copies it into dist).
 *   - src/data/collectionStates.json: which /colleges/<slug>/<state> pages exist.
 *     Committed, so routing and school-page links work in dev and key-less builds.
 *   - public/data/majors/<slug>.json + index.json, and the committed
 *     src/data/majorPages.json (which /majors/<slug> pages exist), from
 *     .cache/programs.json.
 *
 * Without the cache it keeps the committed collectionStates.json and writes no
 * rows; the pages then show a "data unavailable" note. The build never breaks here.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { SchoolFacts } from '../src/seo/schoolContent';
import { buildCollectionData, hubSummary } from '../src/seo/collectionContent';
import { buildMajorData, majorIndex, type ProgramRecord } from '../src/seo/majorContent';

const FACTS_CACHE = resolve('.cache/school-facts.json');
const ROWS_DIR = resolve('public/data/collections');
const STATES_OUT = resolve('src/data/collectionStates.json');
const PROGRAMS_CACHE = resolve('.cache/programs.json');
const MAJORS_DIR = resolve('public/data/majors');
const MAJOR_PAGES_OUT = resolve('src/data/majorPages.json');

function main() {
  if (!existsSync(FACTS_CACHE)) {
    console.warn('No .cache/school-facts.json; skipping collection data (pages will show no data).');
    return;
  }
  const facts = JSON.parse(readFileSync(FACTS_CACHE, 'utf8')) as SchoolFacts[];
  const { rows, states } = buildCollectionData(facts);
  mkdirSync(ROWS_DIR, { recursive: true });
  for (const [slug, list] of Object.entries(rows)) {
    writeFileSync(resolve(ROWS_DIR, `${slug}.json`), JSON.stringify(list));
  }
  writeFileSync(resolve(ROWS_DIR, 'index.json'), JSON.stringify(hubSummary(rows)));
  writeFileSync(STATES_OUT, JSON.stringify(states, null, 2) + '\n');
  const statePages = Object.values(states).reduce((t, s) => t + s.length, 0);

  // Majors (/majors pages)
  if (existsSync(PROGRAMS_CACHE)) {
    const programs = JSON.parse(readFileSync(PROGRAMS_CACHE, 'utf8')) as ProgramRecord[];
    const majors = buildMajorData(facts, programs);
    mkdirSync(MAJORS_DIR, { recursive: true });
    for (const [slug, list] of Object.entries(majors.rows)) {
      writeFileSync(resolve(MAJORS_DIR, `${slug}.json`), JSON.stringify(list));
    }
    writeFileSync(resolve(MAJORS_DIR, 'index.json'), JSON.stringify(majorIndex(majors)));
    writeFileSync(MAJOR_PAGES_OUT, JSON.stringify(majors.majors, null, 2) + '\n');
    console.log(`✓ Majors: ${majors.majors.length} pages`);
  } else {
    console.warn('No .cache/programs.json; skipping major data (keeping committed majorPages.json).');
  }

  console.log(
    `✓ Collections: ${Object.entries(rows)
      .map(([k, v]) => `${k} ${v.length}`)
      .join(', ')}; ${statePages} state pages`,
  );
}

main();
