import { getTurso } from "@/lib/turso/client";

// Public-facing show data for the /recommend page.
// No auth needed — Turso has no RLS, and this data is intentionally public.

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
    "SELECT name, media_type, poster_path, tmdb_id, current_season, current_episode, archived FROM shows WHERE archived = 0 ORDER BY name ASC",
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
