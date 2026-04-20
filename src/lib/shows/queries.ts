import { getTurso } from "@/lib/turso/client";
import { addDays, todayInAppTz } from "@/lib/dates";
import type { ShowRow } from "./types";
import type { TmdbEpisode } from "@/lib/tmdb/types";

export const COMING_SOON_DAYS = 14;
export const NEW_THIS_WEEK_DAYS = 7;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): ShowRow {
  return {
    id: r.id,
    media_type: r.media_type,
    tmdb_id: r.tmdb_id,
    name: r.name,
    poster_path: r.poster_path,
    backdrop_path: r.backdrop_path,
    overview: r.overview,
    status: r.status,
    first_air_date: r.first_air_date,
    next_episode: r.next_episode ? JSON.parse(r.next_episode) as TmdbEpisode : null,
    last_episode: r.last_episode ? JSON.parse(r.last_episode) as TmdbEpisode : null,
    next_air_date: r.next_air_date,
    last_air_date: r.last_air_date,
    current_season: r.current_season,
    current_episode: r.current_episode,
    archived: r.archived === 1,
    rating: r.rating as number | null ?? null,
    review: r.review as string | null ?? null,
    last_refreshed_at: r.last_refreshed_at,
    recommended_by: r.recommended_by ?? null,
    recommended_by_email: r.recommended_by_email ?? null,
    added_by: r.added_by,
    created_at: r.created_at,
    added_by_name: r.display_name ?? null,
  };
}

export async function getNewThisWeek(): Promise<ShowRow[]> {
  const today = todayInAppTz();
  const weekAgo = addDays(today, -(NEW_THIS_WEEK_DAYS - 1));
  const result = await getTurso().execute({
    sql: `SELECT s.*, u.display_name FROM shows s
          LEFT JOIN users u ON s.added_by = u.id
          WHERE s.archived = 0
            AND s.last_air_date >= ? AND s.last_air_date <= ?
          ORDER BY s.last_air_date DESC`,
    args: [weekAgo, today],
  });
  return result.rows.map(mapRow);
}

export async function getComingSoon(): Promise<ShowRow[]> {
  const today = todayInAppTz();
  const horizon = addDays(today, COMING_SOON_DAYS);
  const result = await getTurso().execute({
    sql: `SELECT s.*, u.display_name FROM shows s
          LEFT JOIN users u ON s.added_by = u.id
          WHERE s.archived = 0
            AND s.next_air_date >= ? AND s.next_air_date <= ?
          ORDER BY s.next_air_date ASC`,
    args: [today, horizon],
  });
  return result.rows.map(mapRow);
}

export async function getAllTrackedShows(
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<ShowRow[]> {
  const sql = includeArchived
    ? `SELECT s.*, u.display_name FROM shows s
       LEFT JOIN users u ON s.added_by = u.id
       ORDER BY s.name ASC`
    : `SELECT s.*, u.display_name FROM shows s
       LEFT JOIN users u ON s.added_by = u.id
       WHERE s.archived = 0
       ORDER BY s.name ASC`;
  const result = await getTurso().execute(sql);
  return result.rows.map(mapRow);
}

export async function getFinishedShows(): Promise<ShowRow[]> {
  const result = await getTurso().execute(
    `SELECT s.*, u.display_name FROM shows s
     LEFT JOIN users u ON s.added_by = u.id
     WHERE s.archived = 1
     ORDER BY s.name ASC`,
  );
  return result.rows.map(mapRow);
}

export async function getShowById(id: string): Promise<ShowRow | null> {
  const result = await getTurso().execute({
    sql: `SELECT s.*, u.display_name FROM shows s
          LEFT JOIN users u ON s.added_by = u.id
          WHERE s.id = ?`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}
