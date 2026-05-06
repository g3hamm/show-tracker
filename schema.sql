-- Chillflix schema for Turso (SQLite).
-- Run once via `turso db shell <db-name> < schema.sql`
-- or paste into the Turso dashboard SQL editor.
-- Safe to re-run: uses IF NOT EXISTS throughout.

-- ---------- users (synced from Clerk on first action) ----------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,           -- Clerk user ID (e.g. user_xxxxx)
  display_name  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- families ----------
CREATE TABLE IF NOT EXISTS families (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_by  TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- family_members ----------
CREATE TABLE IF NOT EXISTS family_members (
  family_id   TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
  joined_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (family_id, user_id)
);

-- ---------- family_invites ----------
CREATE TABLE IF NOT EXISTS family_invites (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by  TEXT NOT NULL REFERENCES users(id),
  expires_at  TEXT,
  used_by     TEXT REFERENCES users(id),
  used_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS family_invites_code_idx ON family_invites (invite_code);

-- ---------- family_subscriptions (streaming services the family pays for) ----------
CREATE TABLE IF NOT EXISTS family_subscriptions (
  family_id     TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  provider_id   INTEGER NOT NULL,
  provider_name TEXT NOT NULL,
  logo_path     TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (family_id, provider_id)
);

-- ---------- queues (groups + solo) ----------
CREATE TABLE IF NOT EXISTS queues (
  id          TEXT PRIMARY KEY,
  family_id   TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'group',   -- 'solo' | 'group'
  owner_id    TEXT REFERENCES users(id),       -- set for solo queues
  share_code  TEXT UNIQUE,                     -- unique code for public recommendation URL
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS queues_family_idx ON queues (family_id);
CREATE INDEX IF NOT EXISTS queues_share_code_idx ON queues (share_code);

-- ---------- queue_members (who can see/edit a group queue) ----------
CREATE TABLE IF NOT EXISTS queue_members (
  queue_id    TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (queue_id, user_id)
);

-- ---------- shows (TMDB catalog — shared reference data) ----------
CREATE TABLE IF NOT EXISTS shows (
  id                TEXT PRIMARY KEY,       -- app-generated UUID
  media_type        TEXT NOT NULL DEFAULT 'show',
  tmdb_id           INTEGER,                -- nullable so books can skip it
  name              TEXT NOT NULL,
  poster_path       TEXT,
  backdrop_path     TEXT,
  overview          TEXT,
  status            TEXT,
  first_air_date    TEXT,                   -- YYYY-MM-DD
  next_episode      TEXT,                   -- JSON string
  last_episode      TEXT,                   -- JSON string
  next_air_date     TEXT,                   -- YYYY-MM-DD
  last_air_date     TEXT,                   -- YYYY-MM-DD
  watch_providers   TEXT,                   -- JSON array of streaming providers
  last_refreshed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS shows_next_air_date_idx ON shows (next_air_date);
CREATE INDEX IF NOT EXISTS shows_last_air_date_idx ON shows (last_air_date);
CREATE INDEX IF NOT EXISTS shows_media_type_idx    ON shows (media_type);
CREATE INDEX IF NOT EXISTS shows_tmdb_id_idx       ON shows (tmdb_id);
CREATE UNIQUE INDEX IF NOT EXISTS shows_tmdb_media_uniq ON shows (tmdb_id, media_type);

-- ---------- queue_shows (tracking state per queue) ----------
CREATE TABLE IF NOT EXISTS queue_shows (
  id                   TEXT PRIMARY KEY,
  queue_id             TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  show_id              TEXT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  current_season       INTEGER,
  current_episode      INTEGER,
  archived             INTEGER NOT NULL DEFAULT 0,
  rating               INTEGER,
  review               TEXT,
  private              INTEGER NOT NULL DEFAULT 0,  -- only meaningful on solo queues
  recommended_by       TEXT,
  recommended_by_email TEXT,
  recommendation_note  TEXT,
  added_by             TEXT REFERENCES users(id),
  added_at             TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS queue_shows_uniq ON queue_shows (queue_id, show_id);
CREATE INDEX IF NOT EXISTS queue_shows_queue_idx ON queue_shows (queue_id);
CREATE INDEX IF NOT EXISTS queue_shows_show_idx ON queue_shows (show_id);
CREATE INDEX IF NOT EXISTS queue_shows_archived_idx ON queue_shows (queue_id, archived);

-- ---------- recommendations (public submission inbox, per-queue) ----------
CREATE TABLE IF NOT EXISTS recommendations (
  id                TEXT PRIMARY KEY,       -- app-generated UUID
  queue_id          TEXT REFERENCES queues(id) ON DELETE SET NULL,
  media_type        TEXT NOT NULL DEFAULT 'show',
  tmdb_id           INTEGER,
  title             TEXT NOT NULL,
  poster_path       TEXT,
  recommender_name  TEXT NOT NULL CHECK (length(recommender_name) BETWEEN 1 AND 60),
  recommender_email TEXT,                    -- optional, for "we watched it" notifications
  note              TEXT CHECK (note IS NULL OR length(note) <= 1000),
  overview          TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS recommendations_created_at_idx ON recommendations (created_at DESC);
CREATE INDEX IF NOT EXISTS recommendations_media_type_idx ON recommendations (media_type);
CREATE INDEX IF NOT EXISTS recommendations_queue_idx ON recommendations (queue_id);
