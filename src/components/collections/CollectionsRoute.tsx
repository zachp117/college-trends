import { useEffect, useState } from 'react';
import type { CollectionRoute } from '../../data/collections';
import {
  HUB_META,
  HUB_TITLE,
  collectionMeta,
  collectionTitle,
  summarize,
  type CollectionRow,
  type HubSummary,
} from '../../seo/collectionContent';
import { CollectionPage } from './CollectionPage';
import { CollectionsHub } from './CollectionsHub';
import { SiteFooter, SiteHeader } from './SiteChrome';

/** Keep <title> and the meta description in step with in-app navigation. */
function setHead(title: string, description: string) {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}

async function loadJson<T>(file: string): Promise<T> {
  const res = await fetch(`/data/collections/${file}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

function Unavailable({ loading }: { loading: boolean }) {
  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-500">
        {loading ? 'Loading colleges…' : 'This data is temporarily unavailable. Please try again later.'}
      </main>
      <SiteFooter />
    </div>
  );
}

/** Renders /colleges routes. `route` comes from parseCollectionPath (non-null). */
export function CollectionsRoute({ route }: { route: CollectionRoute }) {
  const [rows, setRows] = useState<CollectionRow[] | null>(null);
  const [hub, setHub] = useState<HubSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const slug = route.kind === 'collection' ? route.collection.slug : null;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const p = slug
      ? loadJson<CollectionRow[]>(`${slug}.json`).then((r) => !cancelled && setRows(r))
      : loadJson<HubSummary>('index.json').then((h) => !cancelled && setHub(h));
    p.catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (route.kind === 'hub') {
      setHead(HUB_TITLE, HUB_META);
    } else if (rows) {
      const { collection: c, state } = route;
      const local = summarize(state ? rows.filter((r) => r.state === state.code) : rows);
      setHead(collectionTitle(c, state, local.count), collectionMeta(c, state, local));
    }
  }, [route, rows]);

  if (route.kind === 'hub') return <CollectionsHub summary={hub} />;
  if (!rows) return <Unavailable loading={!failed} />;
  return <CollectionPage collection={route.collection} state={route.state} rows={rows} />;
}
