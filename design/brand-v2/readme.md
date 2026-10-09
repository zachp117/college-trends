# College Trends — Brand Kit

College Trends (https://www.collegetrends.io/) is a free, searchable dashboard for the U.S. Department of Education's College Scorecard: cost, earnings, debt, completion and demographics for every U.S. college. Audience: students, families, counselors, journalists.

Logo direction: option **1D** from `College Trends Wordmark.dc.html` (stacked Schibsted Grotesk ExtraBold + mono descriptor). Site theme color from the live site: `#08111f`.

## Index
- `College Trends Brand Kit.dc.html` — visual guidelines (logo, color, type, icons, favicons, UI, voice, downloads)
- `College Trends Website UI Kit.dc.html` — clickable Home → Explore → College profile
- `College Trends Wordmark.dc.html` — original logo exploration (1a–1f)
- `styles.css` → `tokens/{fonts,colors,typography,spacing}.css`
- `assets/logo/` — outlined SVG (+PNG) for stacked, descriptor, lockup, inline, monogram; colorways ink / white / black / reverse
- `assets/favicon/` — favicon.ico (16/32/48), favicon.svg, PNGs, apple-touch-icon.png, icon-192/512, icon-maskable-512, site.webmanifest
- `assets/og-image.png` — 1200×630 social card
- `assets/fonts/` — Schibsted Grotesk 400–800, IBM Plex Mono 400–600 (woff2, SIL OFL)
- `SKILL.md`

## Logo
- Primary: stacked "College / Trends", ExtraBold, −3% tracking, 0.9 line height.
- Descriptor: 0.44em blue rule + "SCORECARD DATA" in Plex Mono, +14% tracking.
- Lockup: stacked + vertical blue rule + "FEDERAL DATA / EVERY U.S. / COLLEGE".
- Inline: single line, for nav bars.
- Monogram: "CT" + rule on navy. Rule dropped at 16px.
- Clear space = cap height of "C". Minimums: stacked 72px, descriptor 120px, inline 110px, monogram 16px.
- Ink colorway uses Navy 950 + Blue 500; white colorway uses #F2F4F7 + Blue 300.

## CONTENT FUNDAMENTALS
- Neutral, factual, sourced. State number, unit, source. No rankings, superlatives or hype.
- Address the reader as "you" sparingly; mostly describe data.
- Sentence case for headlines/buttons. ALL CAPS only for mono labels (`MEDIAN EARNINGS · 10 YRS`).
- Lead with the family's question, then the official field name ("What will I actually pay?" → "Average net price").
- No emoji. Unicode ▲ ▼ allowed for deltas only.
- Example: "Graduates earn a median $58,214 ten years after enrolling."

## VISUAL FOUNDATIONS
- Color: Navy 950 and Paper 100 carry ~90% of surfaces. Scorecard Blue (#3461AC; #90BFFF on navy) for links, focus, brand rule, highlighted chart series. Data palette = oklch(0.62 0.12 h), hues 260/190/75/30/150/320. Semantic green/coral/amber at matching chroma.
- Type: Schibsted Grotesk (all text), IBM Plex Mono (labels, units, sources, table numbers, tabular-nums). Display 64/0.95/800, H1 44, H2 32, H3 22, body 16/1.55, label 11 mono +14%.
- Layout: 1200px container, 32px gutters, 64px sticky navy nav. Generous vertical rhythm (72–96px between sections).
- Structure: 1px hairlines (#DCD8CC) and a 2px navy top rule over tables/stat groups. Grids of cells separated by 2px gaps showing the border color.
- Corners: 0 or 2px. No pills except none — badges are square.
- Shadows: essentially none; `--shadow-2` only for floating menus.
- Backgrounds: flat navy or paper. No gradients, textures or photography required; if imagery is added, use documentary campus photography, natural color.
- Motion: 120–200ms color/opacity, ease-out. No bounces, no scroll effects.
- Hover: buttons darken (navy → Navy 700, blue → Blue 600); rows tint to Paper 50; text links darken. Press: no shrink.
- Focus: 2px Blue 400 outline, 2px offset.
- Transparency/blur: not used.
- Cards: white fill, 1px hairline, no shadow, square.

## ICONOGRAPHY
- Lucide (open source, CDN: `https://unpkg.com/lucide-static@0.454.0/icons/<name>.svg`), stroke 1.75–2, 20px UI / 24px feature, inherits text color (apply via CSS mask or inline SVG with `currentColor`).
- Always paired with a text label. Never filled or multicolor. No emoji. Unicode ▲▼ for deltas.
- Core set: search, graduation-cap, landmark, dollar-sign, trending-up/down, users, map-pin, scale, chart-column, download, info, external-link, bookmark, sliders-horizontal, chevron-left/right.

## Web install
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#08111f">
<meta property="og:image" content="https://www.collegetrends.io/og-image.png">
```

## Notes
- Institutions and figures in the UI kit are fictional samples.
- UI kit screens are new designs in this system, not recreations of the current live site (its markup wasn't available).
