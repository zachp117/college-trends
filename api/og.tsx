/**
 * Vercel Edge Function: dynamic OG image for a single school.
 *
 * URL:   /api/og?id=243744
 * Out:   1200×630 PNG with the school's name, city/state, and three
 *        headline stats (net price, 10-yr median earnings, admit rate).
 *
 * Crawlers (iMessage, Slack, Twitter, etc.) hit this when someone shares
 * a /school/<slug>-<id> link. First request per (id × edge node) takes
 * ~500ms; subsequent requests are cached by Vercel's edge for a day.
 *
 * If the id is missing/invalid, or the API call fails, we redirect to
 * the static /og-image.png fallback so previews still render.
 */
import { ImageResponse } from '@vercel/og';

// Vercel Edge Runtime exposes process.env even though it's not full Node.
// Declared inline so we don't have to pull in @types/node for one usage.
declare const process: { env: Record<string, string | undefined> };

export const config = {
  runtime: 'edge',
};

const SITE_URL = 'https://www.collegetrends.io';
const SCORECARD_BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

interface SchoolFields {
  'school.name'?: string;
  'school.city'?: string;
  'school.state'?: string;
  'latest.cost.avg_net_price.overall'?: number | null;
  'latest.cost.avg_net_price.public'?: number | null;
  'latest.cost.avg_net_price.private'?: number | null;
  'latest.earnings.10_yrs_after_entry.median'?: number | null;
  'latest.admissions.admission_rate.overall'?: number | null;
  'latest.completion.completion_rate_4yr_150nt'?: number | null;
}

async function fetchSchool(id: string): Promise<SchoolFields | null> {
  const apiKey = process.env.VITE_SCORECARD_API_KEY;
  if (!apiKey) return null;

  const fields = [
    'school.name',
    'school.city',
    'school.state',
    'latest.cost.avg_net_price.overall',
    'latest.cost.avg_net_price.public',
    'latest.cost.avg_net_price.private',
    'latest.earnings.10_yrs_after_entry.median',
    'latest.admissions.admission_rate.overall',
    'latest.completion.completion_rate_4yr_150nt',
  ].join(',');

  const url = `${SCORECARD_BASE}?api_key=${apiKey}&id=${id}&fields=${fields}&per_page=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: SchoolFields[] };
  return data.results?.[0] ?? null;
}

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) {
      return Response.redirect(`${SITE_URL}/og-image.png`, 302);
    }

    const school = await fetchSchool(id);
    if (!school) {
      return Response.redirect(`${SITE_URL}/og-image.png`, 302);
    }

    const name = school['school.name'] ?? 'College';
    const city = school['school.city'] ?? '';
    const state = school['school.state'] ?? '';
    const location = city && state ? `${city}, ${state}` : city || state || '';

    // Net price: public schools report under .public, private under .private.
    // .overall is filled for some institutions; fall back through the chain.
    const netPrice =
      school['latest.cost.avg_net_price.overall'] ??
      school['latest.cost.avg_net_price.public'] ??
      school['latest.cost.avg_net_price.private'] ??
      null;

    const earnings = school['latest.earnings.10_yrs_after_entry.median'] ?? null;
    const admit = school['latest.admissions.admission_rate.overall'] ?? null;
    // If admit is suppressed (open-enrollment schools), surface completion instead
    // so we always have three stats.
    const completion = school['latest.completion.completion_rate_4yr_150nt'] ?? null;

    const thirdLabel = admit != null ? 'Admit rate' : '4-yr completion';
    const thirdValue = admit != null ? fmtPct(admit) : fmtPct(completion);

    // School-name sizing: shrink long names so they don't wrap into 4+ lines.
    // 80px fits ~22 chars per line at our padding; scale down past that.
    const nameLen = name.length;
    const nameSize = nameLen > 50 ? 60 : nameLen > 32 ? 76 : 96;

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 80px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
            color: '#ffffff',
            fontFamily: 'Inter',
          }}
        >
          {/* Header: domain eyebrow */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: '24px',
                color: '#94a3b8',
                marginBottom: '32px',
                letterSpacing: '0.02em',
              }}
            >
              collegetrends.io
            </div>

            {/* School name */}
            <div
              style={{
                display: 'flex',
                fontSize: `${nameSize}px`,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: '20px',
                maxWidth: '1040px',
              }}
            >
              {name}
            </div>

            {/* Location */}
            {location && (
              <div
                style={{
                  display: 'flex',
                  fontSize: '32px',
                  color: '#cbd5e1',
                  fontWeight: 400,
                }}
              >
                {location}
              </div>
            )}
          </div>

          {/* Stat row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '24px',
              marginTop: '32px',
            }}
          >
            <Stat label="Net price" value={fmtMoney(netPrice)} />
            <Stat label="10-yr median earnings" value={fmtMoney(earnings)} />
            <Stat label={thirdLabel} value={thirdValue} />
          </div>

          {/* Footer accent + attribution */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '24px',
            }}
          >
            <div style={{ display: 'flex', fontSize: '18px', color: '#94a3b8' }}>
              Federal data via U.S. Dept. of Education College Scorecard
            </div>
            <div
              style={{
                display: 'flex',
                width: '60px',
                height: '8px',
                background: '#6366f1',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          // Cache aggressively at the edge — school data changes once a year.
          'Cache-Control':
            'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        },
      },
    );
  } catch (err) {
    console.error('OG generation failed:', err);
    return Response.redirect(`${SITE_URL}/og-image.png`, 302);
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '20px 24px',
        background: 'rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.10)',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '16px',
          color: '#94a3b8',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: '40px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
    </div>
  );
}
