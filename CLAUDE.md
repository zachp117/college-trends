# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

College Trends (collegetrends.io) — a free dashboard for exploring U.S. Department of Education College Scorecard data. Audience: prospective students, parents, and college researchers. Users search and compare colleges across cost, earnings, debt, completion, and demographics. Auth-gated (hidden in prod) counselor features let users manage student lists and tag schools as reach/match/safety with notes and application status.

Repo on GitHub: `zachp117/college-trends`. Deploys to Vercel.

## Stack

- **Frontend**: React 18 SPA, Vite, Tailwind, recharts, react-simple-maps
- **Backend**: Hono (Node) on port 3001 in dev, served as a Node function on Vercel in prod
- **DB**: SQLite via `better-sqlite3` + Drizzle ORM (WAL enabled). File at `data.db` locally (gitignored); on Vercel use `DATABASE_URL`.
- **Auth**: Better Auth (tables in same SQLite DB)
- **Build extras**: @vercel/og powers per-school OG images (`api/og.tsx`); the generic OG card is a static `public/og-image.png`

## Brand: CollegeTrends

Colors come from brand v1 (`design/brand/brand-tokens.css`, imported by `src/index.css`): use
`var(--ct-*)` or the remapped Tailwind scales, never raw hex. Cyan is the only action/emphasis color,
done by remapping the `indigo-*` scale to a cyan ramp in `tailwind.config.js`, so existing accent
usages are brand cyan. Brand corner radii (`md/lg/xl`) and a faint cyan/violet page tint on paper.
The site stays **light**; headers are light/sticky with a blurred background (navy on About,
What's new, 404). The dark theme was intentionally NOT adopted. **Space Grotesk, Space Mono and
`// LABEL` eyebrows are no longer used** (owner's call). Chart series palettes are still their
original hues. Keep it trustworthy, editorial, minimal.

**Brand v2 (partial adoption, `design/brand-v2/`):** only these pieces are adopted. Ignore the rest of
that kit (its colors, navy/paper palette, square corners, mono labels, UI kit layouts).
- **Wordmarks** in `public/brand/` (stacked, descriptor, lockup, inline, monogram; ink / white / black).
  Render via `BrandLogo` / `Wordmark` in `src/components/Wordmark.tsx`, which documents and enforces the
  rules: clear space = cap height of the "C"; min widths stacked 72 / descriptor 120 / inline 110 /
  monogram 16px; don't stretch, recolor, add shadows/glows/outlines, or use on low-contrast grounds.
- **Type:** Schibsted Grotesk (self-hosted, `src/styles/fonts.css`) for all text **and numbers**. Don't
  turn on `tabular-nums` with it: its tabular figures also widen commas/periods ("$17 , 889"), so
  `.tabular-nums` / `.font-num` are reset to normal digits in `src/index.css`.
- **Icons:** Lucide (`lucide-react`), `strokeWidth={1.75}`, always with a text label. No emoji.
- **Favicon, web clips, `site.webmanifest`, and `public/og-image.png`** come from the kit (static files).
- **Voice:** plain, sourced, neutral.

**Copy rules (owner's, strict):** no em dashes anywhere (missing data renders as `n/a`); no "X, not Y" /
"not just X" negation constructions; write for students, parents, and researchers, not counselors.

## Commands

```bash
npm run dev          # Vite frontend on :5173 (proxies /api to :3001)
npm run dev:server   # Hono backend on :3001 with tsx watch — REQUIRED in a second terminal
npm run build        # tsc -b && vite build && tsx scripts/generate-sitemap.ts
npm run preview      # serve dist/ locally, Vercel-like
npm run typecheck    # tsc --noEmit
npm run db:generate  # Drizzle: schema → migration SQL
npm run db:migrate   # apply migrations from server/db/migrations/
```

**Dev requires two terminals.** Running only `npm run dev` will leave API calls failing — the proxy connects but there's no backend behind it.

After cloning or wiping `data.db`, run `npm run db:migrate` to bootstrap the schema.

## Architecture, the non-obvious parts

**Dual SPA + static-stub routing for social previews.** `vercel.json` rewrites `/*` → `/index.html` so the React SPA handles routing client-side. BUT `scripts/generate-sitemap.ts` writes per-school HTML files to `dist/school/<slug>-<id>/index.html` at build time with school-specific Open Graph + Twitter Card meta. These static stubs ship the same React bundle, so a real visitor clicking the link still gets the SPA; only crawlers (Facebook, Twitter, iMessage, etc.) read the per-school meta. If you change SPA routes or the OG flow, both paths need to stay consistent.

**Build-time OG generation has a fallback.** The generic OG PNG is a static file from the brand kit. `scripts/generate-sitemap.ts` fetches the full school list from data.gov (needs `VITE_SCORECARD_API_KEY`) and emits per-school stubs + `sitemap.xml`. If the key is missing or the API call fails, the build still succeeds with a static sitemap and no per-school stubs — intentional, so CI doesn't break when secrets are absent. Don't add hard failure on missing API key.

**Drizzle schema is split into two layers** in `server/db/schema.ts`: Better Auth core tables (`user`, `session`, `account`, `verification`) and app tables (`student`, `studentSchool`, `pinnedSchool`). Migrations are SQL files in `server/db/migrations/` — the canonical schema source. `data.db` is gitignored.

**One Hono process serves all `/api/*`** — no per-route serverless functions in `api/`. Vercel runs the Hono server as a single Node function. Routes include `/api/auth/*` (Better Auth handler), `/api/pins`, `/api/students`, `/api/student-schools`, `/api/health`.

## Env vars

See `.env.example`. Notable:
- `VITE_SCORECARD_API_KEY` — data.gov College Scorecard key, used at build time by sitemap generation. Set in Vercel project env for per-school OG to work in prod.
- `VITE_AUTH_ENABLED` — toggles the auth UI. Defaults ON in dev, OFF in prod build (counselor features hidden from anonymous traffic).

## Things to ignore

- `.claude/worktrees/` — Claude Code artifact, untracked, safe to ignore.
- `data.db`, `data.db-shm`, `data.db-wal` — local SQLite files, gitignored. Don't commit.
