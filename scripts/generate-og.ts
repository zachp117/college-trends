/**
 * One-off generator for the site's Open Graph preview card.
 *
 * Output: public/og-image.png (1200×630, the canonical OG dimensions).
 *
 * The PNG is committed to the repo and shipped via Vite's public/ dir,
 * so it's served as /og-image.png with no build-time work. Re-run this
 * script (`tsx scripts/generate-og.ts`) whenever the brand or tagline
 * changes.
 *
 * Tools:
 *   - satori           — turn a JSX-like layout into SVG
 *   - @resvg/resvg-js  — rasterize SVG → PNG (WASM, no native build)
 *   - assets/fonts/    — Inter OTF files (satori needs TTF/OTF)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROOT = process.cwd();
const FONT_REGULAR = readFileSync(resolve(ROOT, 'assets/fonts/Inter-Regular.woff'));
const FONT_BOLD = readFileSync(resolve(ROOT, 'assets/fonts/Inter-Bold.woff'));

const WIDTH = 1200;
const HEIGHT = 630;

// Satori takes a React-like element tree. We avoid JSX so we don't have to
// configure tsx's JSX runtime — plain object literals work fine.
const layout = {
  type: 'div',
  props: {
    style: {
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '80px',
      // Slate-900 → Indigo-900 diagonal gradient, matching the site header.
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
      color: '#ffffff',
      fontFamily: 'Inter',
      position: 'relative',
    },
    children: [
      // Eyebrow / domain
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            fontSize: '26px',
            color: '#94a3b8',
            marginBottom: '36px',
            fontWeight: 400,
            letterSpacing: '0.02em',
          },
          children: 'collegetrends.io',
        },
      },
      // Wordmark
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            fontSize: '128px',
            fontWeight: 700,
            lineHeight: 1.0,
            marginBottom: '28px',
            letterSpacing: '-0.03em',
          },
          children: 'College Trends',
        },
      },
      // Tagline
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            fontSize: '34px',
            fontWeight: 400,
            color: '#cbd5e1',
            lineHeight: 1.25,
            maxWidth: '960px',
          },
          children:
            'Federal data on every U.S. college — cost, earnings, debt, completion, demographics.',
        },
      },
      // Footer accent — small attribution + colored bar
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            position: 'absolute',
            bottom: '60px',
            left: '80px',
            right: '80px',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  fontSize: '20px',
                  color: '#94a3b8',
                  fontWeight: 400,
                },
                children: 'Powered by the U.S. Dept. of Education College Scorecard',
              },
            },
            // Tiny accent square (visual interest)
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  width: '60px',
                  height: '8px',
                  background: '#6366f1',
                  borderRadius: '4px',
                },
              },
            },
          ],
        },
      },
    ],
  },
};

async function main() {
  const svg = await satori(layout as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Inter', data: FONT_REGULAR, weight: 400, style: 'normal' },
      { name: 'Inter', data: FONT_BOLD, weight: 700, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  })
    .render()
    .asPng();

  mkdirSync(resolve(ROOT, 'public'), { recursive: true });
  const out = resolve(ROOT, 'public/og-image.png');
  writeFileSync(out, png);
  console.log(`✓ Wrote ${out} (${WIDTH}x${HEIGHT}, ${png.length.toLocaleString()} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
