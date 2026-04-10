# HAMMFLIX

A small Next.js app for tracking TV shows you're watching. Built for two
people to share one list, with a separate public page where friends can drop
recommendations.

## Features

- **Clerk sign-in** — magic link, OAuth, or email/password.
- **Shared show list** — any authenticated user sees the same tracker.
- **Episode progress** — track which episode you're on (S2E5).
- **Dashboard sections**
  - _New this week_ — episodes that aired in the last 7 days (ET).
  - _Coming soon_ — episodes airing in the next 14 days (ET).
  - _Recommended to us_ — public submissions (see below).
  - _All tracked shows_ — everything non-archived.
- **Search & add** via TMDB.
- **Finish/archive** shows without deleting them.
- **Manual "Refresh now"** button + **daily Vercel Cron** that re-fetches
  each show from TMDB so the badges stay current.
- **Public `/recommend` page** — anyone (no login) can submit a show with
  their name and a note. Shows your current watchlist with episode progress.
  "Watched" overlay on shows you've already finished. Abuse protection:
  honeypot, min-fill-time, per-IP rate limit.

## Tech stack

- Next.js 15 App Router, TypeScript, Tailwind v4
- Turso (libSQL/SQLite) for the database
- Clerk for authentication
- TMDB API for show metadata (server-side only)
- Vercel for hosting + cron

## Setup

### 1. Turso

1. Install the Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
2. Create a database: `turso db create hammflix`
3. Run the schema: `turso db shell hammflix < schema.sql`
4. Get the URL: `turso db show hammflix --url`
5. Create an auth token: `turso db tokens create hammflix`

### 2. Clerk

1. Create a new application at [clerk.com](https://clerk.com).
2. In the Clerk dashboard, grab your **Publishable key** and **Secret key**.
3. Since this is a two-person app, you can restrict signups in Clerk's
   dashboard under **User & Authentication → Restrictions**.

### 3. TMDB

1. Sign up at [themoviedb.org](https://www.themoviedb.org/).
2. Go to **Settings → API** and create a **v3 API key**.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
TURSO_DATABASE_URL=libsql://hammflix-<your-org>.turso.io
TURSO_AUTH_TOKEN=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
TMDB_API_KEY=
CRON_SECRET=          # any long random string
NEXT_PUBLIC_SITE_URL=http://localhost:4141
```

### 5. Run

```
npm install
npm run dev
```

Open [http://localhost:4141](http://localhost:4141).

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import into Vercel. Set all the env vars from `.env.example` in
   **Settings → Environment Variables**, plus:
   `NEXT_PUBLIC_SITE_URL=https://<your-vercel-domain>`.
3. `vercel.json` registers a daily cron at 09:00 UTC hitting
   `/api/cron/refresh`. Vercel automatically sends `Authorization: Bearer
   $CRON_SECRET`.

## Manual cron trigger

```
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:4141/api/cron/refresh
```

Returns `{ ok, refreshed, failed }`.

## Directory layout

```
src/
  app/
    page.tsx                   # Dashboard
    login/                     # Clerk sign-in
    search/                    # Add a show
    show/[id]/                 # Show detail
    recommend/                 # PUBLIC submission form (no auth)
    api/cron/refresh/          # Daily TMDB refresh
  components/                  # Shared cards/buttons
  lib/
    turso/                     # libSQL client
    tmdb/                      # API wrapper + types + mappers
    shows/                     # queries + server actions
    recommendations/           # queries + server actions
    dates.ts                   # timezone-aware week math
schema.sql                     # Turso/SQLite schema
middleware.ts                  # Clerk auth middleware
vercel.json                    # cron schedule
```

## Architectural notes

- **Shared list, not per-user**: every authenticated user reads/writes the
  same `shows` table. Auth checks happen in server actions.
- **Public `/recommend`**: the submission action writes directly to Turso
  (no RLS needed). All validation happens in the server action.
- **`media_type` column**: reserved now (`'show'` default) so a future phase
  can add books without a migration.
- **Timezone**: `APP_TZ = 'America/New_York'` in `src/lib/dates.ts`. Change
  there to adjust "new this week" / "coming soon" math.
