import type { TmdbTvDetails } from "./types";

// Row shape written into public.shows. Not an exhaustive column list —
// auto-managed columns (id, created_at, added_by, archived) are handled
// separately.
export interface ShowRowFromTmdb {
  media_type: "show";
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  status: string | null;
  first_air_date: string | null;
  next_episode: TmdbTvDetails["next_episode_to_air"] | null;
  last_episode: TmdbTvDetails["last_episode_to_air"] | null;
  next_air_date: string | null;
  last_air_date: string | null;
  last_refreshed_at: string;
}

export function mapTvDetailsToRow(d: TmdbTvDetails): ShowRowFromTmdb {
  return {
    media_type: "show",
    tmdb_id: d.id,
    name: d.name,
    poster_path: d.poster_path ?? null,
    backdrop_path: d.backdrop_path ?? null,
    overview: d.overview || null,
    status: d.status || null,
    first_air_date: d.first_air_date || null,
    next_episode: d.next_episode_to_air ?? null,
    last_episode: d.last_episode_to_air ?? null,
    next_air_date: d.next_episode_to_air?.air_date ?? null,
    last_air_date: d.last_episode_to_air?.air_date ?? null,
    last_refreshed_at: new Date().toISOString(),
  };
}
