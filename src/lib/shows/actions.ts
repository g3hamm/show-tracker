"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getTurso } from "@/lib/turso/client";
import { tmdbSearchTv, tmdbGetTv, tmdbSearchMovie, tmdbGetMovie } from "@/lib/tmdb/client";
import { mapTvDetailsToRow, mapMovieDetailsToRow } from "@/lib/tmdb/mappers";
import type { MediaRowFromTmdb } from "@/lib/tmdb/mappers";
import { emailEnabled, getResend } from "@/lib/email/client";
import { watchedItEmail } from "@/lib/email/templates";
import { requireQueueAccess } from "@/lib/families/actions";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function ensureUser(userId: string) {
  const user = await currentUser();
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.emailAddresses?.[0]?.emailAddress ?? userId;
  await getTurso().execute({
    sql: `INSERT INTO users (id, display_name) VALUES (?, ?)
          ON CONFLICT (id) DO UPDATE SET display_name = excluded.display_name`,
    args: [userId, displayName],
  });
}

export interface SearchResult {
  tmdbId: number;
  mediaType: "show" | "movie";
  name: string;
  overview: string;
  posterPath: string | null;
  date: string | null;
}

export async function searchShows(query: string): Promise<SearchResult[]> {
  await requireUser();
  const q = query.trim();
  if (!q) return [];

  const [tvRes, movieRes] = await Promise.all([
    tmdbSearchTv(q),
    tmdbSearchMovie(q),
  ]);

  const tvResults: SearchResult[] = tvRes.results.slice(0, 10).map((r) => ({
    tmdbId: r.id,
    mediaType: "show" as const,
    name: r.name,
    overview: r.overview,
    posterPath: r.poster_path,
    date: r.first_air_date,
  }));

  const movieResults: SearchResult[] = movieRes.results.slice(0, 10).map((r) => ({
    tmdbId: r.id,
    mediaType: "movie" as const,
    name: r.title,
    overview: r.overview,
    posterPath: r.poster_path,
    date: r.release_date,
  }));

  return [...tvResults, ...movieResults];
}

async function upsertCatalog(row: MediaRowFromTmdb): Promise<string> {
  const existing = await getTurso().execute({
    sql: "SELECT id FROM shows WHERE tmdb_id = ? AND media_type = ?",
    args: [row.tmdb_id, row.media_type],
  });

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id as string;
    await getTurso().execute({
      sql: `UPDATE shows SET name = ?, poster_path = ?, backdrop_path = ?,
            overview = ?, status = ?, first_air_date = ?,
            next_episode = ?, last_episode = ?,
            next_air_date = ?, last_air_date = ?,
            watch_providers = ?, last_refreshed_at = ?
            WHERE id = ?`,
      args: [
        row.name, row.poster_path, row.backdrop_path,
        row.overview, row.status, row.first_air_date,
        row.next_episode ? JSON.stringify(row.next_episode) : null,
        row.last_episode ? JSON.stringify(row.last_episode) : null,
        row.next_air_date, row.last_air_date,
        row.watch_providers ? JSON.stringify(row.watch_providers) : null,
        row.last_refreshed_at, id,
      ],
    });
    return id;
  }

  const id = crypto.randomUUID();
  await getTurso().execute({
    sql: `INSERT INTO shows (id, media_type, tmdb_id, name, poster_path, backdrop_path,
          overview, status, first_air_date, next_episode, last_episode,
          next_air_date, last_air_date, watch_providers, last_refreshed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, row.media_type, row.tmdb_id, row.name,
      row.poster_path, row.backdrop_path, row.overview, row.status,
      row.first_air_date,
      row.next_episode ? JSON.stringify(row.next_episode) : null,
      row.last_episode ? JSON.stringify(row.last_episode) : null,
      row.next_air_date, row.last_air_date,
      row.watch_providers ? JSON.stringify(row.watch_providers) : null,
      row.last_refreshed_at,
    ],
  });
  return id;
}

export async function addShow(
  queueId: string,
  tmdbId: number,
  mediaType: "show" | "movie" = "show",
  recommendedBy?: string | null,
  recommendedByEmail?: string | null,
  recommendationNote?: string | null,
): Promise<void> {
  const userId = await requireQueueAccess(queueId);
  await ensureUser(userId);

  let row: MediaRowFromTmdb;
  if (mediaType === "movie") {
    const details = await tmdbGetMovie(tmdbId);
    row = mapMovieDetailsToRow(details);
  } else {
    const details = await tmdbGetTv(tmdbId);
    row = mapTvDetailsToRow(details);
  }

  const showId = await upsertCatalog(row);

  await getTurso().execute({
    sql: `INSERT OR IGNORE INTO queue_shows
          (id, queue_id, show_id, recommended_by, recommended_by_email, recommendation_note, added_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(), queueId, showId,
      recommendedBy ?? null, recommendedByEmail ?? null,
      recommendationNote ?? null, userId,
    ],
  });

  revalidatePath("/");
}

export async function removeShow(queueShowId: string): Promise<void> {
  await requireUser();
  await getTurso().execute({
    sql: "DELETE FROM queue_shows WHERE id = ?",
    args: [queueShowId],
  });
  revalidatePath("/");
}

export async function archiveShow(queueShowId: string, archived: boolean): Promise<void> {
  await requireUser();

  if (archived) {
    try {
      const qsResult = await getTurso().execute({
        sql: `SELECT qs.*, s.tmdb_id, s.media_type, s.name
              FROM queue_shows qs
              JOIN shows s ON qs.show_id = s.id
              WHERE qs.id = ?`,
        args: [queueShowId],
      });
      const qs = qsResult.rows[0];

      if (qs && qs.media_type === "show" && qs.tmdb_id) {
        const details = await tmdbGetTv(qs.tmdb_id as number);
        const lastEp = details.last_episode_to_air;
        if (lastEp) {
          await getTurso().execute({
            sql: "UPDATE queue_shows SET archived = 1, archived_at = datetime('now'), current_season = ?, current_episode = ? WHERE id = ?",
            args: [lastEp.season_number, lastEp.episode_number, queueShowId],
          });
        } else {
          await getTurso().execute({
            sql: "UPDATE queue_shows SET archived = 1, archived_at = datetime('now') WHERE id = ?",
            args: [queueShowId],
          });
        }
      } else {
        await getTurso().execute({
          sql: "UPDATE queue_shows SET archived = 1, archived_at = datetime('now') WHERE id = ?",
          args: [queueShowId],
        });
      }

      if (qs && emailEnabled() && qs.recommended_by_email) {
        const fromEmail = process.env.RESEND_FROM ?? "Chillflix <onboarding@resend.dev>";
        const { subject, html } = watchedItEmail({
          recommenderName: qs.recommended_by as string,
          title: qs.name as string,
          mediaType: qs.media_type as string,
        });
        getResend()
          .emails.send({
            from: fromEmail,
            to: qs.recommended_by_email as string,
            subject,
            html,
          })
          .catch(() => {});
      }
    } catch {
      await getTurso().execute({
        sql: "UPDATE queue_shows SET archived = 1, archived_at = datetime('now') WHERE id = ?",
        args: [queueShowId],
      });
    }
  } else {
    await getTurso().execute({
      sql: "UPDATE queue_shows SET archived = 0, archived_at = NULL WHERE id = ?",
      args: [queueShowId],
    });
  }

  revalidatePath("/");
}

export async function updateProgress(
  queueShowId: string,
  season: number | null,
  episode: number | null,
): Promise<void> {
  await requireUser();
  await getTurso().execute({
    sql: "UPDATE queue_shows SET current_season = ?, current_episode = ? WHERE id = ?",
    args: [season, episode, queueShowId],
  });
  revalidatePath("/");
}

export async function rateShow(
  queueShowId: string,
  rating: number | null,
  review: string | null,
): Promise<void> {
  await requireUser();
  await getTurso().execute({
    sql: "UPDATE queue_shows SET rating = ?, review = ? WHERE id = ?",
    args: [rating, review ?? null, queueShowId],
  });
  revalidatePath("/");
}

export async function togglePrivate(queueShowId: string): Promise<void> {
  await requireUser();
  await getTurso().execute({
    sql: "UPDATE queue_shows SET private = CASE WHEN private = 0 THEN 1 ELSE 0 END WHERE id = ?",
    args: [queueShowId],
  });
  revalidatePath("/");
}

export async function refreshAllShows(): Promise<{ refreshed: number; failed: number; unarchived: number }> {
  const result = await getTurso().execute(
    "SELECT id, tmdb_id, media_type FROM shows WHERE tmdb_id IS NOT NULL",
  );

  let refreshed = 0;
  let failed = 0;
  let unarchived = 0;
  const CHUNK = 5;
  const rows = result.rows;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      batch.map(async (s) => {
        const showId = s.id as string;
        const tmdbId = s.tmdb_id as number;
        const mediaType = s.media_type as string;

        let row: MediaRowFromTmdb;
        if (mediaType === "movie") {
          const details = await tmdbGetMovie(tmdbId);
          row = mapMovieDetailsToRow(details);
        } else {
          const details = await tmdbGetTv(tmdbId);
          row = mapTvDetailsToRow(details);
        }

        await getTurso().execute({
          sql: `UPDATE shows SET name = ?, poster_path = ?, backdrop_path = ?,
                overview = ?, status = ?, first_air_date = ?,
                next_episode = ?, last_episode = ?,
                next_air_date = ?, last_air_date = ?,
                watch_providers = ?, last_refreshed_at = ?
                WHERE id = ?`,
          args: [
            row.name, row.poster_path, row.backdrop_path,
            row.overview, row.status, row.first_air_date,
            row.next_episode ? JSON.stringify(row.next_episode) : null,
            row.last_episode ? JSON.stringify(row.last_episode) : null,
            row.next_air_date, row.last_air_date,
            row.watch_providers ? JSON.stringify(row.watch_providers) : null,
            row.last_refreshed_at, showId,
          ],
        });

        if (mediaType === "show" && row.last_episode) {
          const archivedQs = await getTurso().execute({
            sql: "SELECT id, current_season, current_episode FROM queue_shows WHERE show_id = ? AND archived = 1",
            args: [showId],
          });
          for (const qs of archivedQs.rows) {
            const savedSeason = qs.current_season as number | null;
            const savedEpisode = qs.current_episode as number | null;
            if (savedSeason != null && savedEpisode != null) {
              const newSeason = row.last_episode.season_number;
              const newEpisode = row.last_episode.episode_number;
              if (newSeason > savedSeason || (newSeason === savedSeason && newEpisode > savedEpisode)) {
                await getTurso().execute({
                  sql: "UPDATE queue_shows SET archived = 0 WHERE id = ?",
                  args: [qs.id as string],
                });
                unarchived += 1;
              }
            }
          }
        }
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") refreshed += 1;
      else failed += 1;
    }
  }

  return { refreshed, failed, unarchived };
}

export async function refreshAll(): Promise<{ refreshed: number; failed: number }> {
  await requireUser();
  const result = await refreshAllShows();
  revalidatePath("/");
  return result;
}
