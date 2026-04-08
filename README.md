# Show Tracker

A small Next.js app for tracking TV shows you're watching. Built for two
people to share one list, with a separate public page where friends can drop
recommendations.

## Features

- **Magic-link sign-in** (Supabase Auth) — no passwords.
- **Shared show list** — any authenticated user sees the same tracker.
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
  their name and a note. Submissions appear in the "Recommended to us"
  section. Abuse protection: honeypot, min-fill-time, per-IP rate limit.

## Tech stack

- Next.js 15 App Router, TypeScript, Tailwind v4
- Supabase (Postgres + Auth) via `@supabase/ssr`
- TMDB API for show metadata (server-side only)
- Vercel for hosting + cron

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → Providers → Email**, make sure the Email provider
   is enabled. You can ignore the "Confirm email" setting — it's a
   password-flow option and doesn't affect magic links (the link itself *is*
   the confirmation).
4. Because this is a two-person app, **turn off public signups** so random
   people can't log in by typing an email. Go to **Authentication → Sign In
   / Providers** (or **Settings → Authentication** depending on dashboard
   version) and disable **"Allow new users to sign up"**. Then add your two
   accounts manually in **Authentication → Users → Add user → Send invite**
   (or "Create new user" with auto-confirm).
5. In **Authentication → URL Configuration**, add redirect URLs:
   - `http://localhost:4141/auth/callback`
   - `https://<your-production-domain>/auth/callback`

### 2. TMDB

1. Sign up at [themoviedb.org](https://www.themoviedb.org/).
2. Go to **Settings → API** and create a **v3 API key**.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # sb_publishable_...
SUPABASE_SECRET_KEY=                    # sb_secret_... (server-only)
TMDB_API_KEY=
CRON_SECRET=          # any long random string
NEXT_PUBLIC_SITE_URL=http://localhost:4141
```

### 4. Run

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
3. Add your production domain to Supabase redirect URLs (see setup step 1.4).
4. `vercel.json` registers a daily cron at 09:00 UTC hitting
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
    login/                     # Magic-link sign-in
    search/                    # Add a show
    show/[id]/                 # Show detail
    recommend/                 # PUBLIC submission form (no auth)
    auth/callback/             # Supabase code exchange
    api/cron/refresh/          # Daily TMDB refresh
  components/                  # Shared cards/buttons
  lib/
    supabase/                  # client/server/middleware/admin helpers
    tmdb/                      # API wrapper + types + mappers
    shows/                     # queries + server actions
    recommendations/           # queries + server actions
    dates.ts                   # timezone-aware week math
supabase/
  schema.sql                   # tables, indexes, RLS, triggers
middleware.ts                  # session refresh + auth gate
vercel.json                    # cron schedule
```

## Architectural notes

- **Shared list, not per-user**: every authenticated user reads/writes the
  same `shows` table. RLS enforces "must be authenticated" but not ownership.
- **Public `/recommend`**: the submission action uses the service-role
  Supabase client (server-only) so anonymous users can never touch PostgREST
  directly. All validation happens in the server action.
- **`media_type` column**: reserved now (`'show'` default) so a future phase
  can add books without a migration.
- **Timezone**: `APP_TZ = 'America/New_York'` in `src/lib/dates.ts`. Change
  there to adjust "new this week" / "coming soon" math.
