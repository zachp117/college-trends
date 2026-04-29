/**
 * SEO-friendly URLs for school detail pages.
 * Pattern: /school/<slug>-<id>  (e.g., /school/stanford-university-243744)
 *
 * The numeric ID is what we route on; the slug is purely for readability and
 * search engine indexing. Mismatched slugs still resolve correctly — only the
 * trailing ID is required.
 */

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    // Strip diacritics
    .replace(/[̀-ͯ]/g, '')
    // & → and; ampersand-spaced names like "A & M" become "a-and-m"
    .replace(/&/g, ' and ')
    // Non-alphanumerics → hyphen
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Build a school URL given an ID and (optionally) the school name. If the
 * name isn't known yet (e.g., we're opening a detail page before the school
 * has loaded), falls back to /school/<id>.
 */
export function buildSchoolPath(id: number, name?: string | null): string {
  if (!name) return `/school/${id}`;
  const slug = slugify(name);
  return slug ? `/school/${slug}-${id}` : `/school/${id}`;
}

export function buildSchoolUrl(id: number, name?: string | null): string {
  if (typeof window === 'undefined') return buildSchoolPath(id, name);
  return `${window.location.origin}${buildSchoolPath(id, name)}`;
}

/**
 * Extract the numeric school ID from a path. Supports both the new SEO format
 * /school/<slug>-<id> and the bare-ID variant /school/<id>. Returns null if
 * the path doesn't match.
 */
export function parseSchoolPath(path: string): number | null {
  // Strip trailing slash
  const clean = path.replace(/\/+$/, '');
  // /school/<id> OR /school/<...>-<id>
  const m = clean.match(/^\/school\/(?:.*-)?(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}
