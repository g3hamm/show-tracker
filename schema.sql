-- HAMMFLIX schema for Turso (SQLite).
-- Run once via `turso db shell <db-name> < schema.sql`
-- or paste into the Turso dashboard SQL editor.
-- Safe to re-run: uses IF NOT EXISTS throughout.

-- ---------- users (synced from Clerk on first action) ----------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,           -- Clerk user ID (e.g. user_xxxxx)
  display_name  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- shows (shared catalog) ----------
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
  current_season    INTEGER,
  current_episode   INTEGER,
  archived          INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  rating            INTEGER,                     -- 1-5 stars
  review            TEXT,                        -- personal notes / inside jokes
  watch_providers   TEXT,                        -- JSON array of streaming providers
  last_refreshed_at TEXT NOT NULL DEFAULT (datetime('now')),
  recommended_by    TEXT,                    -- name of person who recommended
  recommended_by_email TEXT,                 -- email of recommender (for notifications)
  recommendation_note TEXT,                  -- what they said about it
  added_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS shows_next_air_date_idx ON shows (next_air_date);
CREATE INDEX IF NOT EXISTS shows_last_air_date_idx ON shows (last_air_date);
CREATE INDEX IF NOT EXISTS shows_archived_idx      ON shows (archived);
CREATE INDEX IF NOT EXISTS shows_media_type_idx    ON shows (media_type);
CREATE INDEX IF NOT EXISTS shows_tmdb_id_idx       ON shows (tmdb_id);
CREATE UNIQUE INDEX IF NOT EXISTS shows_tmdb_media_uniq ON shows (tmdb_id, media_type);

-- ---------- recommendations (public submission inbox) ----------
CREATE TABLE IF NOT EXISTS recommendations (
  id                TEXT PRIMARY KEY,       -- app-generated UUID
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
