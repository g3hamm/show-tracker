import { getTurso } from "@/lib/turso/client";
import { addDays, todayInAppTz } from "@/lib/dates";
import type { ShowRow } from "./types";
import type { TmdbEpisode, StoredWatchProvider } from "@/lib/tmdb/types";

export const COMING_SOON_DAYS = 14;
export const NEW_THIS_WEEK_DAYS = 7;

const QUEUE_SHOW_SELECT = `
  SELECT s.*, qs.id as queue_show_id, qs.queue_id, qs.current_season,
         qs.current_episode, qs.archived, qs.rating, qs.review, qs.private,
         qs.recommended_by, qs.recommended_by_email, qs.recommendation_note,
         qs.added_by, qs.added_at, u.display_name
  FROM queue_shows qs
  JOIN shows s ON qs.show_id = s.id
  LEFT JOIN users u ON qs.added_by = u.id`;

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
    watch_providers: r.watch_providers ? JSON.parse(r.watch_providers) as StoredWatchProvider[] : null,
    last_refreshed_at: r.last_refreshed_at,
    created_at: r.created_at,
    queue_show_id: r.queue_show_id,
    queue_id: r.queue_id,
    current_season: r.current_season,
    current_episode: r.current_episode,
    archived: (r.archived ?? 0) === 1,
    rating: r.rating as number | null ?? null,
    review: r.review as string | null ?? null,
    is_private: (r.private ?? 0) === 1,
    recommended_by: r.recommended_by ?? null,
    recommended_by_email: r.recommended_by_email ?? null,
    recommendation_note: r.recommendation_note as string | null ?? null,
    added_by: r.added_by ?? null,
    added_by_name: r.display_name ?? null,
    added_at: r.added_at,
  };
}

export async function getNewThisWeek(queueId: string): Promise<ShowRow[]> {
  const today = todayInAppTz();
  const weekAgo = addDays(today, -(NEW_THIS_WEEK_DAYS - 1));
  const result = await getTurso().execute({
    sql: `${QUEUE_SHOW_SELECT}
          WHERE qs.queue_id = ? AND qs.archived = 0
            AND s.last_air_date >= ? AND s.last_air_date <= ?
          ORDER BY s.last_air_date DESC`,
    args: [queueId, weekAgo, today],
  });
  return result.rows.map(mapRow);
}

export async function getComingSoon(queueId: string): Promise<ShowRow[]> {
  const today = todayInAppTz();
  const horizon = addDays(today, COMING_SOON_DAYS);
  const result = await getTurso().execute({
    sql: `${QUEUE_SHOW_SELECT}
          WHERE qs.queue_id = ? AND qs.archived = 0
            AND s.next_air_date >= ? AND s.next_air_date <= ?
          ORDER BY s.next_air_date ASC`,
    args: [queueId, today, horizon],
  });
  return result.rows.map(mapRow);
}

export async function getAllTrackedShows(
  queueId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<ShowRow[]> {
  const archiveClause = includeArchived ? "" : "AND qs.archived = 0";
  const result = await getTurso().execute({
    sql: `${QUEUE_SHOW_SELECT}
          WHERE qs.queue_id = ? ${archiveClause}
          ORDER BY s.name ASC`,
    args: [queueId],
  });
  return result.rows.map(mapRow);
}

export async function getFinishedShows(queueId: string): Promise<ShowRow[]> {
  const result = await getTurso().execute({
    sql: `${QUEUE_SHOW_SELECT}
          WHERE qs.queue_id = ? AND qs.archived = 1
          ORDER BY s.name ASC`,
    args: [queueId],
  });
  return result.rows.map(mapRow);
}

export interface CrossQueueEntry {
  queue_name: string;
  queue_type: "solo" | "group";
  current_season: number | null;
  current_episode: number | null;
  archived: boolean;
  owner_display_name: string | null;
}

export async function getShowAcrossQueues(
  showId: string,
  familyId: string,
  excludeQueueId?: string,
): Promise<CrossQueueEntry[]> {
  const result = await getTurso().execute({
    sql: `SELECT q.name as queue_name, q.type as queue_type,
                 qs.current_season, qs.current_episode, qs.archived,
                 u.display_name as owner_display_name
          FROM queue_shows qs
          JOIN queues q ON qs.queue_id = q.id
          LEFT JOIN users u ON q.owner_id = u.id
          WHERE qs.show_id = ? AND q.family_id = ? AND qs.private = 0
                ${excludeQueueId ? "AND qs.queue_id != ?" : ""}
          ORDER BY q.type ASC, q.name ASC`,
    args: excludeQueueId
      ? [showId, familyId, excludeQueueId]
      : [showId, familyId],
  });
  return result.rows.map((r) => ({
    queue_name: r.queue_name as string,
    queue_type: r.queue_type as "solo" | "group",
    current_season: r.current_season as number | null,
    current_episode: r.current_episode as number | null,
    archived: (r.archived as number) === 1,
    owner_display_name: r.owner_display_name as string | null,
  }));
}

export interface FamilyTrackingInfo {
  tmdb_id: number;
  media_type: string;
  queue_name: string;
  archived: boolean;
}

export async function getFamilyTrackingStatus(
  familyId: string,
): Promise<FamilyTrackingInfo[]> {
  const result = await getTurso().execute({
    sql: `SELECT s.tmdb_id, s.media_type, q.name as queue_name, qs.archived
          FROM queue_shows qs
          JOIN shows s ON qs.show_id = s.id
          JOIN queues q ON qs.queue_id = q.id
          WHERE q.family_id = ? AND qs.private = 0 AND s.tmdb_id IS NOT NULL`,
    args: [familyId],
  });
  return result.rows.map((r) => ({
    tmdb_id: r.tmdb_id as number,
    media_type: r.media_type as string,
    queue_name: r.queue_name as string,
    archived: (r.archived as number) === 1,
  }));
}

export async function getShowById(queueId: string, showId: string): Promise<ShowRow | null> {
  const result = await getTurso().execute({
    sql: `${QUEUE_SHOW_SELECT}
          WHERE qs.queue_id = ? AND s.id = ?`,
    args: [queueId, showId],
  });
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}
