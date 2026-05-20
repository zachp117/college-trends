# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

College Trends (collegetrends.io) — a free dashboard for exploring U.S. Department of Education College Scorecard data. Users search and compare colleges across cost, earnings, debt, completion, and demographics. Authenticated counselor features let users manage student lists and tag schools as reach/match/safety with notes and application status.

Repo on GitHub: `zachp117/college-trends`. Deploys to Vercel.

## Stack

- **Frontend**: React 18 SPA, Vite, Tailwind, recharts, react-simple-maps
- **Backend**: Hono (Node) on port 3001 in dev, served as a Node function on Vercel in prod
- **DB**: SQLite via `better-sqlite3` + Drizzle ORM (WAL enabled). File at `data.db` locally (gitignored); on Vercel use `DATABASE_URL`.
- **Auth**: Better Auth (tables in same SQLite DB)
- **Build extras**: satori + @resvg/resvg-js for OG images; @vercel/og available

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

**Build-time OG generation has a fallback.** `scripts/generate-og.ts` renders the generic OG PNG. `scripts/generate-sitemap.ts` fetches the full school list from data.gov (needs `VITE_SCORECARD_API_KEY`) and emits per-school stubs + `sitemap.xml`. If the key is missing or the API call fails, the build still succeeds with a static sitemap and no per-school stubs — intentional, so CI doesn't break when secrets are absent. Don't add hard failure on missing API key.

**Drizzle schema is split into two layers** in `server/db/schema.ts`: Better Auth core tables (`user`, `session`, `account`, `verification`) and app tables (`student`, `studentSchool`, `pinnedSchool`). Migrations are SQL files in `server/db/migrations/` — the canonical schema source. `data.db` is gitignored.

**One Hono process serves all `/api/*`** — no per-route serverless functions in `api/`. Vercel runs the Hono server as a single Node function. Routes include `/api/auth/*` (Better Auth handler), `/api/pins`, `/api/students`, `/api/student-schools`, `/api/health`.

## Env vars

See `.env.example`. Notable:
- `VITE_SCORECARD_API_KEY` — data.gov College Scorecard key, used at build time by sitemap generation. Set in Vercel project env for per-school OG to work in prod.
- `VITE_AUTH_ENABLED` — toggles the auth UI. Defaults ON in dev, OFF in prod build (counselor features hidden from anonymous traffic).

## Things to ignore

- `.claude/worktrees/` — Claude Code artifact, untracked, safe to ignore.
- `data.db`, `data.db-shm`, `data.db-wal` — local SQLite files, gitignored. Don't commit.
