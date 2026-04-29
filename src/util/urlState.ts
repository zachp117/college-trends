import type { DegreeLevel, OwnershipCode, SearchFilters } from '../api/scorecard';

export interface UrlState {
  tab?: string;
  filters: SearchFilters;
  selectedIds: number[];
  detailSchoolId?: number;
}

function parseIntList(s: string | null): number[] {
  if (!s) return [];
  return s
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n));
}

export function decodeStateFromUrl(search: string): UrlState {
  const p = new URLSearchParams(search);
  const filters: SearchFilters = {};

  const name = p.get('name');
  if (name) filters.name = name;

  const state = p.get('state');
  if (state) filters.state = state;

  const ownership = parseIntList(p.get('ownership')) as OwnershipCode[];
  if (ownership.length > 0) filters.ownership = ownership;

  const minSize = p.get('minSize');
  if (minSize) {
    const n = Number(minSize);
    if (!Number.isNaN(n)) filters.minSize = n;
  }

  const maxSize = p.get('maxSize');
  if (maxSize) {
    const n = Number(maxSize);
    if (!Number.isNaN(n)) filters.maxSize = n;
  }

  const degreeLevels = parseIntList(p.get('degreeLevels')) as DegreeLevel[];
  if (degreeLevels.length > 0) filters.degreeLevels = degreeLevels;

  const selectedIds = parseIntList(p.get('selected'));
  const tab = p.get('tab') ?? undefined;
  const detailRaw = p.get('detail');
  const detailSchoolId = detailRaw !== null && !Number.isNaN(Number(detailRaw))
    ? Number(detailRaw)
    : undefined;

  return { tab, filters, selectedIds, detailSchoolId };
}

export function encodeStateToSearch(state: UrlState): string {
  const p = new URLSearchParams();
  if (state.tab) p.set('tab', state.tab);
  const f = state.filters;
  if (f.name) p.set('name', f.name);
  if (f.state) p.set('state', f.state);
  if (f.ownership && f.ownership.length > 0) p.set('ownership', f.ownership.join(','));
  if (f.minSize !== undefined) p.set('minSize', String(f.minSize));
  if (f.maxSize !== undefined) p.set('maxSize', String(f.maxSize));
  if (f.degreeLevels && f.degreeLevels.length > 0)
    p.set('degreeLevels', f.degreeLevels.join(','));
  if (state.selectedIds.length > 0) p.set('selected', state.selectedIds.join(','));
  if (state.detailSchoolId !== undefined) p.set('detail', String(state.detailSchoolId));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function replaceUrlState(state: UrlState): void {
  const search = encodeStateToSearch(state);
  const newUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState(null, '', newUrl);
}
