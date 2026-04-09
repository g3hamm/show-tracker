-- Show Tracker schema.
-- Run this once in the Supabase SQL Editor for a fresh project.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible,
-- and includes a migration block at the bottom for existing installs.

create extension if not exists "pgcrypto";

-- ---------- profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles modify" on public.profiles;
create policy "profiles modify"
  on public.profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-insert a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- shows (shared catalog) ----------
create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  media_type text not null default 'show',      -- reserved for phase 2 books
  tmdb_id integer unique,                       -- nullable so books can skip it
  name text not null,
  poster_path text,
  backdrop_path text,
  overview text,
  status text,
  first_air_date date,
  next_episode jsonb,
  last_episode jsonb,
  next_air_date date,                           -- denormalized from next_episode.air_date
  last_air_date date,                           -- denormalized from last_episode.air_date
  current_season integer,                    -- episode progress: which season the user is on
  current_episode integer,                   -- episode progress: which episode the user is on
  archived boolean not null default false,
  last_refreshed_at timestamptz not null default now(),
  -- FK points at profiles (not auth.users) so PostgREST can embed the display
  -- name. Every auth user has a profile via handle_new_user().
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists shows_next_air_date_idx on public.shows (next_air_date);
create index if not exists shows_last_air_date_idx on public.shows (last_air_date);
create index if not exists shows_archived_idx      on public.shows (archived);
create index if not exists shows_media_type_idx    on public.shows (media_type);

alter table public.shows enable row level security;

drop policy if exists "shows read" on public.shows;
create policy "shows read"
  on public.shows for select
  to authenticated
  using (true);

drop policy if exists "shows insert" on public.shows;
create policy "shows insert"
  on public.shows for insert
  to authenticated
  with check (auth.uid() = added_by);

drop policy if exists "shows update" on public.shows;
create policy "shows update"
  on public.shows for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "shows delete" on public.shows;
create policy "shows delete"
  on public.shows for delete
  to authenticated
  using (true);

-- ---------- recommendations (public submission inbox) ----------
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  media_type text not null default 'show',
  tmdb_id integer,                          -- set if submitter picked from TMDB search
  title text not null,
  poster_path text,                         -- captured at submit time if tmdb_id set
  recommender_name text not null check (char_length(recommender_name) between 1 and 60),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists recommendations_created_at_idx on public.recommendations (created_at desc);
create index if not exists recommendations_media_type_idx on public.recommendations (media_type);

alter table public.recommendations enable row level security;

-- Anonymous users never touch this table directly via PostgREST; the
-- public /recommend server action inserts via the service-role key.
-- Authenticated (logged-in) users can read and dismiss.
drop policy if exists "recs read" on public.recommendations;
create policy "recs read"
  on public.recommendations for select
  to authenticated
  using (true);

drop policy if exists "recs delete" on public.recommendations;
create policy "recs delete"
  on public.recommendations for delete
  to authenticated
  using (true);

-- ---------- migration: fix shows.added_by FK ----------
-- Existing installs had shows.added_by -> auth.users(id). PostgREST can't
-- embed profiles through that because auth.users isn't exposed via the API.
-- Repoint the FK at public.profiles(id). No-op on fresh installs.
do $$
declare
  fk_target text;
begin
  select ccu.table_schema || '.' || ccu.table_name
    into fk_target
  from information_schema.table_constraints tc
  join information_schema.constraint_column_usage ccu
    on tc.constraint_name = ccu.constraint_name
   and tc.table_schema = ccu.constraint_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'shows'
    and tc.constraint_type = 'FOREIGN KEY'
    and tc.constraint_name = 'shows_added_by_fkey';

  if fk_target = 'auth.users' then
    alter table public.shows drop constraint shows_added_by_fkey;
    alter table public.shows
      add constraint shows_added_by_fkey
      foreign key (added_by) references public.profiles(id) on delete set null;
  end if;
end$$;

-- ---------- migration: add episode progress columns ----------
-- Safe to re-run: uses IF NOT EXISTS via DO block.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shows' and column_name = 'current_season'
  ) then
    alter table public.shows add column current_season integer;
    alter table public.shows add column current_episode integer;
  end if;
end$$;

-- Force PostgREST to pick up the new relationship immediately.
notify pgrst, 'reload schema';
