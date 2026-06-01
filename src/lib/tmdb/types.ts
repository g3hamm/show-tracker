// Minimal subset of the TMDB API response shapes we care about.

export interface TmdbSearchTvResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  popularity: number;
}

export interface TmdbSearchTvResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbSearchTvResult[];
}

export interface TmdbEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  season_number: number;
  episode_number: number;
  still_path: string | null;
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: string; // 'Returning Series' | 'Ended' | 'Canceled' | ...
  first_air_date: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  next_episode_to_air: TmdbEpisode | null;
  last_episode_to_air: TmdbEpisode | null;
  genres?: { id: number; name: string }[];
  "watch/providers"?: TmdbWatchProviderResults;
}

// --- Movies ---

export interface TmdbSearchMovieResult {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  popularity: number;
}

export interface TmdbSearchMovieResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbSearchMovieResult[];
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: string;
  release_date: string | null;
  runtime: number | null;
  genres?: { id: number; name: string }[];
  "watch/providers"?: TmdbWatchProviderResults;
}

// --- Watch Providers (via JustWatch partnership) ---

export interface StoredWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TmdbWatchProviderCountry {
  link: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
}

export interface TmdbWatchProviderResults {
  results: Record<string, TmdbWatchProviderCountry>;
}
