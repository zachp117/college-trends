# Handoff: CollegeTrends Brand System v1.0

## Overview
The visual language for **CollegeTrends** — the free, no-login dashboard that surfaces
U.S. Department of Education College Scorecard data (cost, earnings, debt, completion,
demographics) for every accredited U.S. college. This bundle contains everything needed
to apply the brand consistently across the site: design tokens, logo/mark, and
ready-to-ship web icons.

Audience for the product: college counselors, administrators, and families who want real
federal numbers, not marketing pages. The brand should read **trustworthy, editorial,
minimal, and a little "engineered"** (the monospace `//` labels are the signature move).

## About the design files
The `.dc.html` file in this bundle is a **design reference** — a prototype showing the
intended look, not production code to copy verbatim. The job is to reproduce this system
inside the existing codebase using its own patterns (React components, your CSS/theme
layer, etc.). `brand-tokens.css` and `brand-tokens.json` ARE meant to be used directly —
drop them into the theme layer and reference the variables.

The PNG/SVG files in `assets/` are **final production assets** — ship them as-is.

## Fidelity
**High-fidelity.** Colors, type, radii, and spacing are final. Match them exactly.

---

## How to install (fastest path)

1. **Commit this folder to the repo** (e.g. `/design/brand/`). Committing the README +
   tokens means Claude Code can read them as context on every future task.
2. **Add the fonts** — in the site `<head>` or CSS:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
   ```
3. **Import the tokens** — `@import` or copy `brand-tokens.css` into the global stylesheet,
   then reference `var(--ct-*)` everywhere instead of hard-coded hex.
4. **Drop the icons** — copy everything in `assets/` to the site's public/static root and
   paste the `<head>` snippet below.
5. *(Optional but recommended)* add a short brand note to the repo's `CLAUDE.md` (see the
   bottom of this file) so the Claude Code agent designs on-brand by default.

### `<head>` snippet — favicon + web clip
```html
<link rel="icon" href="/assets/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#08111f">
```
For PWA/manifest, point `icons` at `assets/icon-192.png` and `assets/icon-512.png`.

---

## Design tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `--ct-ink-navy` | `#08111F` | Primary page background |
| `--ct-surface-navy` | `#0E2035` | Cards, panels, raised surfaces |
| `--ct-signal-cyan` | `#2EB4F0` | The **single** action color — buttons, links, emphasis |
| `--ct-signal-cyan-h` | `#7FD3F7` | Cyan hover / lighter tint |
| `--ct-live-amber` | `#F2A83A` | Counters, "live" tags, numeric flags |
| `--ct-data-violet` | `#6D5EF0` | Data marks / bars — **charts only** |
| `--ct-paper` | `#F4F9FD` | Primary text on navy |
| `--ct-slate` | `#9FB6CC` | Secondary text on navy |
| `--ct-muted` | `#5F7589` | Tertiary text, mono meta, hairlines |
| `--ct-ink-on-light` | `#0F2237` | Text on light surfaces |
| `--ct-line` | `rgba(255,255,255,0.10)` | Borders on dark |

**Chart / categorical palette:** blue `#2F6FEB`, green `#16A34A` (positive), red `#E0483D`
(negative), orange `#F59E0B`, magenta `#E5397F`, teal `#17B3A3`, violet `#6D5EF0`.

**Signature page background** (subtle cyan/violet glow on navy):
```css
background:
  radial-gradient(1100px 700px at 85% -5%, rgba(46,180,240,0.16), transparent 55%),
  radial-gradient(900px 700px at 8% 108%, rgba(109,94,240,0.10), transparent 55%),
  #08111F;
```

### Typography
Two families only.
- **Space Grotesk** — headlines + all UI. Weights 400/500/600/700.
- **Space Mono** — the `// LABEL` kickers, data values, and anything that should feel
  machine-read. Weights 400/700.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display / hero | 76px | 700 | line-height 0.95, letter-spacing −0.02em |
| H1 page title | 48px | 700 | letter-spacing −0.015em |
| H2 section | 30px | 700 | letter-spacing −0.01em |
| Lead | 19px | 500 | `--ct-slate` on navy |
| Body | 16px | 400 | |
| Small | 14px | 400 | |
| Mono label | 13px | 700 | **Space Mono**, UPPERCASE, letter-spacing 0.22em, prefixed with `// ` and colored cyan |

Wordmark: **CollegeTrends** set in Space Grotesk 700 — "College" in `--ct-paper`
(or `--ct-ink-on-light` on light bg), "Trends" in `--ct-signal-cyan`.

### Radius & elevation
- Radius: sm 10px · md 16px · lg 20px · app icon 22% of size.
- Card shadow: `0 8px 24px rgba(0,0,0,0.35)`.

---

## Logo & mark
Primary mark = **CT monogram**: the letters `CT` set in **Space Grotesk 700**, tight
tracking (letter-spacing ≈ −0.04em), optically centered on a navy `#08111F` tile with a
22%-of-size corner radius. The **C** is paper `#F4F9FD`, the **T** is signal cyan
`#2EB4F0`. Vector source: `assets/favicon.svg`; full lockup: `assets/logo-lockup.svg`.

Clearspace: keep padding ≥ 20% of the tile height around the letters. Don't recolor the
letters (C = paper, T = cyan only), don't add gradients or outlines, and don't set the
monogram in any face other than Space Grotesk 700.

> Two alternate directions were explored — a **Trendline** glyph and **The Slash** (`//`) —
> see the brand board. If you switch primary later, the assets can be regenerated; the
> tokens above are unchanged.

---

## Assets in this bundle
| File | Size | Purpose |
|---|---|---|
| `assets/favicon.svg` | vector | Modern browsers (scalable favicon) |
| `assets/favicon-16.png` | 16×16 | Tab bar fallback |
| `assets/favicon-32.png` | 32×32 | Tab / bookmark |
| `assets/favicon-48.png` | 48×48 | Bookmark / Windows |
| `assets/apple-touch-icon.png` | 180×180 | iOS home-screen web clip (full-bleed; iOS rounds corners) |
| `assets/icon-192.png` | 192×192 | PWA / Android manifest |
| `assets/icon-512.png` | 512×512 | PWA splash / manifest |
| `assets/logo-lockup.svg` | vector | Horizontal mark + wordmark |
| `brand-tokens.css` | — | CSS custom properties — use directly |
| `brand-tokens.json` | — | Same tokens, machine-readable |
| `CollegeTrends Brand System.dc.html` | — | The full brand board (reference) |

---

## Suggested `CLAUDE.md` snippet for the repo
Paste this into the project's `CLAUDE.md` so future Claude Code sessions stay on-brand:

```markdown
## Brand: CollegeTrends
Design tokens live in `/design/brand/brand-tokens.css` — always use `var(--ct-*)`, never
raw hex. Fonts: Space Grotesk (UI/headlines), Space Mono (`// LABELS` + data values).
Dark navy (#08111F) product surface; cyan (#2EB4F0) is the ONLY action/emphasis color;
amber (#F2A83A) for live/numeric tags; violet (#6D5EF0) for chart marks only. Section
kickers are uppercase Space Mono prefixed with `// `. Keep it trustworthy, editorial,
minimal. Full reference: `/design/brand/`.
```
