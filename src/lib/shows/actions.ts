"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getTurso } from "@/lib/turso/client";
import { tmdbSearchTv, tmdbGetTv, tmdbSearchMovie, tmdbGetMovie } from "@/lib/tmdb/client";
import { mapTvDetailsToRow, mapMovieDetailsToRow } from "@/lib/tmdb/mappers";
import type { MediaRowFromTmdb } from "@/lib/tmdb/mappers";
import { emailEnabled, getResend } from "@/lib/email/client";
import { watchedItEmail } from "@/lib/email/templates";

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

interface RecommenderInfo {
  name?: string | null;
  email?: string | null;
}

async function upsertMedia(row: MediaRowFromTmdb, userId: string, recommender?: RecommenderInfo | null) {
  const existing = await getTurso().execute({
    sql: "SELECT id FROM shows WHERE tmdb_id = ? AND media_type = ?",
    args: [row.tmdb_id, row.media_type],
  });

  if (existing.rows.length > 0) {
    await getTurso().execute({
      sql: `UPDATE shows SET name = ?, poster_path = ?, backdrop_path = ?,
            overview = ?, status = ?, first_air_date = ?,
            next_episode = ?, last_episode = ?,
            next_air_date = ?, last_air_date = ?,
            last_refreshed_at = ?
            WHERE tmdb_id = ? AND media_type = ?`,
      args: [
        row.name, row.poster_path, row.backdrop_path,
        row.overview, row.status, row.first_air_date,
        row.next_episode ? JSON.stringify(row.next_episode) : null,
        row.last_episode ? JSON.stringify(row.last_episode) : null,
        row.next_air_date, row.last_air_date,
        row.last_refreshed_at, row.tmdb_id, row.media_type,
      ],
    });
  } else {
    const id = crypto.randomUUID();
    await getTurso().execute({
      sql: `INSERT INTO shows (id, media_type, tmdb_id, name, poster_path, backdrop_path,
            overview, status, first_air_date, next_episode, last_episode,
            next_air_date, last_air_date, last_refreshed_at, recommended_by, recommended_by_email, added_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, row.media_type, row.tmdb_id, row.name,
        row.poster_path, row.backdrop_path, row.overview, row.status,
        row.first_air_date,
        row.next_episode ? JSON.stringify(row.next_episode) : null,
        row.last_episode ? JSON.stringify(row.last_episode) : null,
        row.next_air_date, row.last_air_date,
        row.last_refreshed_at,
        recommender?.name ?? null,
        recommender?.email ?? null,
        userId,
      ],
    });
  }
}

export async function addShow(
  tmdbId: number,
  mediaType: "show" | "movie" = "show",
  recommendedBy?: string | null,
  recommendedByEmail?: string | null,
): Promise<void> {
  const userId = await requireUser();
  await ensureUser(userId);

  let row: MediaRowFromTmdb;
  if (mediaType === "movie") {
    const details = await tmdbGetMovie(tmdbId);
    row = mapMovieDetailsToRow(details);
  } else {
    const details = await tmdbGetTv(tmdbId);
    row = mapTvDetailsToRow(details);
  }

  await upsertMedia(row, userId, { name: recommendedBy, email: recommendedByEmail });
  revalidatePath("/");
  revalidatePath("/search");
}

export async function removeShow(id: string): Promise<void> {
  await requireUser();
  await getTurso().execute({ sql: "DELETE FROM shows WHERE id = ?", args: [id] });
  revalidatePath("/");
}

export async function archiveShow(id: string, archived: boolean): Promise<void> {
  await requireUser();
  await getTurso().execute({
    sql: "UPDATE shows SET archived = ? WHERE id = ?",
    args: [archived ? 1 : 0, id],
  });

  // When archiving (finishing), send "we watched it" email to recommender
  if (archived && emailEnabled()) {
    try {
      const result = await getTurso().execute({
        sql: "SELECT name, media_type, recommended_by, recommended_by_email FROM shows WHERE id = ?",
        args: [id],
      });
      const show = result.rows[0];
      if (show?.recommended_by_email) {
        const fromEmail = process.env.RESEND_FROM ?? "HAMMFLIX <onboarding@resend.dev>";
        const { subject, html } = watchedItEmail({
          recommenderName: show.recommended_by as string,
          title: show.name as string,
          mediaType: show.media_type as string,
        });
        getResend()
          .emails.send({
            from: fromEmail,
            to: show.recommended_by_email as string,
            subject,
            html,
          })
          .catch(() => {});
      }
    } catch {
      // Non-critical — don't block archiving
    }
  }

  revalidatePath("/");
}

export async function updateProgress(
  id: string,
  season: number | null,
  episode: number | null,
): Promise<void> {
  await requireUser();
  await getTurso().execute({
    sql: "UPDATE shows SET current_season = ?, current_episode = ? WHERE id = ?",
    args: [season, episode, id],
  });
  revalidatePath("/");
  revalidatePath(`/show/${id}`);
}

export async function rateShow(
  id: string,
  rating: number | null,
  review: string | null,
): Promise<void> {
  await requireUser();
  await getTurso().execute({
    sql: "UPDATE shows SET rating = ?, review = ? WHERE id = ?",
    args: [rating, review ?? null, id],
  });
  revalidatePath("/");
  revalidatePath(`/show/${id}`);
}

// Refresh all tracked media (shows + movies).
export async function refreshAllShows(): Promise<{ refreshed: number; failed: number }> {
  const result = await getTurso().execute(
    "SELECT id, tmdb_id, media_type FROM shows WHERE tmdb_id IS NOT NULL",
  );

  let refreshed = 0;
  let failed = 0;
  const CHUNK = 5;
  const rows = result.rows;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      batch.map(async (s) => {
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
                last_refreshed_at = ?
                WHERE id = ?`,
          args: [
            row.name, row.poster_path, row.backdrop_path,
            row.overview, row.status, row.first_air_date,
            row.next_episode ? JSON.stringify(row.next_episode) : null,
            row.last_episode ? JSON.stringify(row.last_episode) : null,
            row.next_air_date, row.last_air_date,
            row.last_refreshed_at, s.id as string,
          ],
        });
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") refreshed += 1;
      else failed += 1;
    }
  }

  return { refreshed, failed };
}

export async function refreshAll(): Promise<{ refreshed: number; failed: number }> {
  await requireUser();
  const result = await refreshAllShows();
  revalidatePath("/");
  return result;
}
