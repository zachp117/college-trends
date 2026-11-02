import { useEffect, useState } from 'react';
import type { MajorRoute } from '../../data/majors';
import {
  MAJORS_HUB_META,
  MAJORS_HUB_TITLE,
  majorMeta,
  majorTitle,
  summarizeMajor,
  type MajorIndexEntry,
  type MajorRow,
} from '../../seo/majorContent';
import { SiteFooter, SiteHeader } from '../collections/SiteChrome';
import { MajorPage } from './MajorPage';
import { MajorsHub } from './MajorsHub';

function setHead(title: string, description: string) {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}

async function loadJson<T>(file: string): Promise<T> {
  const res = await fetch(`/data/majors/${file}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Renders /majors routes. `route` comes from parseMajorPath (non-null). */
export function MajorsRoute({ route }: { route: MajorRoute }) {
  const [rows, setRows] = useState<MajorRow[] | null>(null);
  const [index, setIndex] = useState<MajorIndexEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const slug = route.kind === 'major' ? route.major.slug : null;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const p = slug
      ? loadJson<MajorRow[]>(`${slug}.json`).then((r) => !cancelled && setRows(r))
      : loadJson<MajorIndexEntry[]>('index.json').then((i) => !cancelled && setIndex(i));
    p.catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (route.kind === 'hub') setHead(MAJORS_HUB_TITLE, MAJORS_HUB_META);
    else if (rows) {
      const s = summarizeMajor(rows);
      setHead(majorTitle(route.major, s), majorMeta(route.major, s));
    }
  }, [route, rows]);

  if (route.kind === 'hub') return <MajorsHub index={index} />;
  if (!rows) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-500">
          {failed ? 'This data is temporarily unavailable. Please try again later.' : 'Loading…'}
        </main>
        <SiteFooter />
      </div>
    );
  }
  return <MajorPage major={route.major} rows={rows} />;
}
