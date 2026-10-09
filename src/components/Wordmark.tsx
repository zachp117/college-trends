/**
 * College Trends wordmarks (outlined SVGs in /public/brand, source: design/brand-v2/).
 *
 * Variants: stacked (primary), descriptor (stacked + "Scorecard data"), lockup
 * (stacked + rule + "Federal data / every U.S. / college"), inline (nav bars under
 * 40px tall), monogram ("CT", favicon/avatar). Colorways: ink (on light grounds),
 * white (on navy/dark grounds), black (one-color print).
 *
 * Rules (from the brand kit, enforced or documented here):
 * - Clear space: keep a margin of x on all sides, where x is the cap height of the
 *   "C" (roughly 0.75 of the inline logo's height). The `pad` wrapper reserves it.
 * - Minimum widths: stacked 72px, descriptor 120px, inline 110px, monogram 16px.
 *   Below these, switch to the next simpler version.
 * - Don't: stretch or condense, recolor outside the colorways, add shadows, glows
 *   or outlines, or place on low-contrast grounds.
 */

export type LogoVariant = 'stacked' | 'descriptor' | 'lockup' | 'inline' | 'monogram';
export type LogoColorway = 'ink' | 'white' | 'black';

// viewBox width / height of each outlined SVG, so we can derive width from height.
const ASPECT: Record<LogoVariant, number> = {
  stacked: 353.58 / 164.56,
  descriptor: 355.34 / 205.48,
  lockup: 668.41 / 164.56,
  inline: 713.29 / 93.6,
  monogram: 1,
};

const MIN_WIDTH: Record<LogoVariant, number> = {
  stacked: 72,
  descriptor: 120,
  lockup: 120,
  inline: 110,
  monogram: 16,
};

function logoSrc(variant: LogoVariant, colorway: LogoColorway): string {
  if (variant === 'monogram') {
    return colorway === 'white'
      ? '/brand/college-trends-monogram-white.svg'
      : '/brand/college-trends-monogram-ink.svg';
  }
  return `/brand/college-trends-${variant}-${colorway}.svg`;
}

export function BrandLogo({
  variant,
  colorway = 'ink',
  height,
  className = '',
}: {
  variant: LogoVariant;
  colorway?: LogoColorway;
  height: number;
  className?: string;
}) {
  // Never render below the brand minimum; scale up to it instead.
  const width = Math.max(height * ASPECT[variant], MIN_WIDTH[variant]);
  const h = width / ASPECT[variant];
  return (
    <img
      src={logoSrc(variant, colorway)}
      alt="College Trends"
      width={Math.round(width)}
      height={Math.round(h)}
      style={{ width, height: h }}
      className={`block max-w-none ${className}`}
      draggable={false}
    />
  );
}

/**
 * Inline wordmark for headers, linking home. `tone="dark"` (default) is the ink
 * colorway for light headers; `tone="light"` is the white colorway for navy headers.
 */
export function Wordmark({
  className = '',
  tone = 'dark',
  height = 18,
}: {
  className?: string;
  tone?: 'light' | 'dark';
  height?: number;
}) {
  return (
    <a
      href="/"
      // Clear space: pad by roughly the cap height of the "C" so nothing crowds the mark.
      style={{ padding: `${Math.round(height * 0.375)}px 0` }}
      className={`inline-flex items-center transition-opacity duration-150 hover:opacity-80 ${className}`}
    >
      <BrandLogo variant="inline" colorway={tone === 'light' ? 'white' : 'ink'} height={height} />
    </a>
  );
}
