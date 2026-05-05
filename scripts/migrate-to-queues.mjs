#!/usr/bin/env node

/**
 * One-shot migration: introduces families, queues, and queue_shows.
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate-to-queues.mjs [familyName]
 *
 * What it does:
 *   1. Creates all new tables (families, family_members, family_invites,
 *      family_subscriptions, queues, queue_members, queue_shows).
 *   2. Creates a default family (name from CLI arg, default "Hamm Family").
 *   3. Makes the first user the admin; all others become members.
 *   4. Creates a "Family" group queue with all users as members.
 *   5. Creates a solo queue for each user.
 *   6. Copies tracking data from shows into queue_shows for the Family queue.
 *   7. Rebuilds the shows table without tracking columns.
 */

import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const FAMILY_NAME = process.argv[2] || "Hamm Family";

function uuid() {
  return crypto.randomUUID();
}

function shareCode() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) code += chars[b % chars.length];
  return code;
}

async function run() {
  console.log("Starting migration...");
  console.log(`Family name: ${FAMILY_NAME}`);

  // --- Step 1: Create new tables ---
  console.log("\n1. Creating new tables...");

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS families (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      created_by  TEXT NOT NULL REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS family_members (
      family_id   TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT NOT NULL DEFAULT 'member',
      joined_at   TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (family_id, user_id)
    );

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

    CREATE TABLE IF NOT EXISTS family_subscriptions (
      family_id     TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      provider_id   INTEGER NOT NULL,
      provider_name TEXT NOT NULL,
      logo_path     TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (family_id, provider_id)
    );

    CREATE TABLE IF NOT EXISTS queues (
      id          TEXT PRIMARY KEY,
      family_id   TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'group',
      owner_id    TEXT REFERENCES users(id),
      share_code  TEXT UNIQUE,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS queues_family_idx ON queues (family_id);
    CREATE INDEX IF NOT EXISTS queues_share_code_idx ON queues (share_code);

    CREATE TABLE IF NOT EXISTS queue_members (
      queue_id    TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (queue_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS queue_shows (
      id                   TEXT PRIMARY KEY,
      queue_id             TEXT NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
      show_id              TEXT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
      current_season       INTEGER,
      current_episode      INTEGER,
      archived             INTEGER NOT NULL DEFAULT 0,
      rating               INTEGER,
      review               TEXT,
      private              INTEGER NOT NULL DEFAULT 0,
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
  `);

  console.log("   Tables created.");

  // --- Step 2: Get all users ---
  const usersResult = await db.execute("SELECT id, display_name FROM users ORDER BY created_at ASC");
  const users = usersResult.rows;

  if (users.length === 0) {
    console.log("\n   No users found. Creating tables only (no data to migrate).");
    console.log("\n   Adding queue_id column to recommendations...");
    try {
      await db.execute("ALTER TABLE recommendations ADD COLUMN queue_id TEXT REFERENCES queues(id) ON DELETE SET NULL");
    } catch (e) {
      if (String(e).includes("duplicate column")) {
        console.log("   queue_id column already exists.");
      } else {
        throw e;
      }
    }
    console.log("\nMigration complete (empty database).");
    return;
  }

  const adminUserId = users[0].id;
  console.log(`\n2. Creating family "${FAMILY_NAME}" with admin: ${users[0].display_name || adminUserId}`);

  // --- Step 3: Create family + members + queues ---
  const familyId = uuid();
  const familyQueueId = uuid();

  const batch = [];

  // Create family
  batch.push({
    sql: "INSERT INTO families (id, name, created_by) VALUES (?, ?, ?)",
    args: [familyId, FAMILY_NAME, adminUserId],
  });

  // Add all users as members
  for (const user of users) {
    batch.push({
      sql: "INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)",
      args: [familyId, user.id, user.id === adminUserId ? "admin" : "member"],
    });
  }

  // Create "Family" group queue
  batch.push({
    sql: "INSERT INTO queues (id, family_id, name, type, share_code) VALUES (?, ?, 'Family', 'group', ?)",
    args: [familyQueueId, familyId, shareCode()],
  });

  // Add all users to the Family queue
  for (const user of users) {
    batch.push({
      sql: "INSERT INTO queue_members (queue_id, user_id) VALUES (?, ?)",
      args: [familyQueueId, user.id],
    });
  }

  // Create solo queue for each user
  const soloQueueIds = new Map();
  for (const user of users) {
    const soloId = uuid();
    soloQueueIds.set(user.id, soloId);
    batch.push({
      sql: "INSERT INTO queues (id, family_id, name, type, owner_id, share_code) VALUES (?, ?, 'My Queue', 'solo', ?, ?)",
      args: [soloId, familyId, user.id, shareCode()],
    });
  }

  await db.batch(batch);
  console.log(`   Family created with ${users.length} member(s).`);
  console.log(`   "Family" group queue created.`);
  console.log(`   ${users.length} solo queue(s) created.`);

  // --- Step 4: Migrate tracking data from shows to queue_shows ---
  console.log("\n3. Migrating tracking data from shows to queue_shows...");

  const showsResult = await db.execute(
    `SELECT id, current_season, current_episode, archived, rating, review,
            recommended_by, recommended_by_email, recommendation_note, added_by, created_at
     FROM shows`
  );

  if (showsResult.rows.length > 0) {
    const migrateBatch = [];
    for (const show of showsResult.rows) {
      migrateBatch.push({
        sql: `INSERT INTO queue_shows (id, queue_id, show_id, current_season, current_episode,
              archived, rating, review, recommended_by, recommended_by_email,
              recommendation_note, added_by, added_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          uuid(),
          familyQueueId,
          show.id,
          show.current_season,
          show.current_episode,
          show.archived,
          show.rating,
          show.review,
          show.recommended_by,
          show.recommended_by_email,
          show.recommendation_note,
          show.added_by,
          show.created_at,
        ],
      });
    }

    // Batch in chunks of 20 (Turso batch limit safety)
    for (let i = 0; i < migrateBatch.length; i += 20) {
      await db.batch(migrateBatch.slice(i, i + 20));
    }

    console.log(`   Migrated ${showsResult.rows.length} show(s) to Family queue.`);
  } else {
    console.log("   No shows to migrate.");
  }

  // --- Step 5: Add queue_id to recommendations ---
  console.log("\n4. Adding queue_id to recommendations table...");
  try {
    await db.execute("ALTER TABLE recommendations ADD COLUMN queue_id TEXT REFERENCES queues(id) ON DELETE SET NULL");
    // Point existing recommendations to the Family queue
    await db.execute({
      sql: "UPDATE recommendations SET queue_id = ?",
      args: [familyQueueId],
    });
    console.log("   queue_id column added and existing recs linked to Family queue.");
  } catch (e) {
    if (String(e).includes("duplicate column")) {
      console.log("   queue_id column already exists.");
    } else {
      throw e;
    }
  }

  // --- Step 6: Rebuild shows table without tracking columns ---
  console.log("\n5. Rebuilding shows table (removing tracking columns)...");

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS shows_new (
      id                TEXT PRIMARY KEY,
      media_type        TEXT NOT NULL DEFAULT 'show',
      tmdb_id           INTEGER,
      name              TEXT NOT NULL,
      poster_path       TEXT,
      backdrop_path     TEXT,
      overview          TEXT,
      status            TEXT,
      first_air_date    TEXT,
      next_episode      TEXT,
      last_episode      TEXT,
      next_air_date     TEXT,
      last_air_date     TEXT,
      watch_providers   TEXT,
      last_refreshed_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO shows_new (id, media_type, tmdb_id, name, poster_path, backdrop_path,
      overview, status, first_air_date, next_episode, last_episode,
      next_air_date, last_air_date, watch_providers, last_refreshed_at, created_at)
    SELECT id, media_type, tmdb_id, name, poster_path, backdrop_path,
      overview, status, first_air_date, next_episode, last_episode,
      next_air_date, last_air_date, watch_providers, last_refreshed_at, created_at
    FROM shows;
  `);

  // Drop old indexes first, then old table, then rename
  await db.executeMultiple(`
    DROP INDEX IF EXISTS shows_next_air_date_idx;
    DROP INDEX IF EXISTS shows_last_air_date_idx;
    DROP INDEX IF EXISTS shows_archived_idx;
    DROP INDEX IF EXISTS shows_media_type_idx;
    DROP INDEX IF EXISTS shows_tmdb_id_idx;
    DROP INDEX IF EXISTS shows_tmdb_media_uniq;

    DROP TABLE shows;
    ALTER TABLE shows_new RENAME TO shows;

    CREATE INDEX IF NOT EXISTS shows_next_air_date_idx ON shows (next_air_date);
    CREATE INDEX IF NOT EXISTS shows_last_air_date_idx ON shows (last_air_date);
    CREATE INDEX IF NOT EXISTS shows_media_type_idx    ON shows (media_type);
    CREATE INDEX IF NOT EXISTS shows_tmdb_id_idx       ON shows (tmdb_id);
    CREATE UNIQUE INDEX IF NOT EXISTS shows_tmdb_media_uniq ON shows (tmdb_id, media_type);
  `);

  console.log("   Shows table rebuilt (tracking columns removed).");

  // --- Done ---
  console.log("\n--- Migration complete! ---");
  console.log(`Family: ${FAMILY_NAME} (${familyId})`);
  console.log(`Family queue: ${familyQueueId}`);
  console.log(`Members: ${users.map((u) => u.display_name || u.id).join(", ")}`);
  console.log("\nNext steps:");
  console.log("  1. Deploy the updated code (Phase 2)");
  console.log("  2. Existing shows are in the 'Family' queue");
  console.log("  3. Each user has a solo queue ready");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
