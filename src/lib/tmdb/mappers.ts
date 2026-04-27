import type { TmdbTvDetails, TmdbMovieDetails, TmdbWatchProviderResults, StoredWatchProvider } from "./types";

const WATCH_REGION = process.env.WATCH_REGION ?? "US";

export function extractWatchProviders(
  wpData: TmdbWatchProviderResults | undefined,
): StoredWatchProvider[] | null {
  if (!wpData?.results) return null;
  const country = wpData.results[WATCH_REGION];
  if (!country) return null;
  const providers = country.flatrate ?? country.free ?? [];
  if (providers.length === 0) return null;
  return providers
    .sort((a, b) => a.display_priority - b.display_priority)
    .map(({ provider_id, provider_name, logo_path }) => ({
      provider_id, provider_name, logo_path,
    }));
}

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
  watch_providers: StoredWatchProvider[] | null;
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
    watch_providers: extractWatchProviders(d["watch/providers"]),
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
    watch_providers: extractWatchProviders(d["watch/providers"]),
  };
}
