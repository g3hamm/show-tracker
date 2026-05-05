import { getTurso } from "@/lib/turso/client";

export interface PublicShowRow {
  name: string;
  media_type: string;
  poster_path: string | null;
  tmdb_id: number | null;
  current_season: number | null;
  current_episode: number | null;
  archived: boolean;
}

export async function getPublicWatchlist(): Promise<PublicShowRow[]> {
  const result = await getTurso().execute(
    `SELECT s.name, s.media_type, s.poster_path, s.tmdb_id,
            qs.current_season, qs.current_episode
     FROM queue_shows qs
     JOIN shows s ON qs.show_id = s.id
     WHERE qs.archived = 0 AND qs.private = 0
     GROUP BY s.tmdb_id, s.media_type
     ORDER BY s.name ASC`,
  );
  return result.rows.map((r) => ({
    name: r.name as string,
    media_type: r.media_type as string,
    poster_path: r.poster_path as string | null,
    tmdb_id: r.tmdb_id as number | null,
    current_season: r.current_season as number | null,
    current_episode: r.current_episode as number | null,
    archived: false,
  }));
}
