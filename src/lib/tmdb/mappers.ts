import type { TmdbTvDetails, TmdbMovieDetails } from "./types";

// Row shape written into public.shows table.
export interface MediaRowFromTmdb {
  media_type: "show" | "movie";
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

/** @deprecated Use MediaRowFromTmdb */
export type ShowRowFromTmdb = MediaRowFromTmdb;

export function mapTvDetailsToRow(d: TmdbTvDetails): MediaRowFromTmdb {
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

export function mapMovieDetailsToRow(d: TmdbMovieDetails): MediaRowFromTmdb {
  return {
    media_type: "movie",
    tmdb_id: d.id,
    name: d.title,
    poster_path: d.poster_path ?? null,
    backdrop_path: d.backdrop_path ?? null,
    overview: d.overview || null,
    status: d.status || null,
    first_air_date: d.release_date || null,
    next_episode: null,
    last_episode: null,
    next_air_date: null,
    last_air_date: null,
    last_refreshed_at: new Date().toISOString(),
  };
}
