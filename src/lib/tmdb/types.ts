// Minimal subset of the TMDB API response shapes we care about.

export interface TmdbSearchTvResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
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
}
