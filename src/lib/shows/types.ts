import type { TmdbEpisode, StoredWatchProvider } from "@/lib/tmdb/types";

// Pure TMDB catalog data (shared across all queues).
export interface CatalogShow {
  id: string;
  media_type: string;
  tmdb_id: number | null;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  status: string | null;
  first_air_date: string | null;
  next_episode: TmdbEpisode | null;
  last_episode: TmdbEpisode | null;
  next_air_date: string | null;
  last_air_date: string | null;
  watch_providers: StoredWatchProvider[] | null;
  last_refreshed_at: string;
  created_at: string;
}

// Catalog + per-queue tracking state.
export interface TrackedShow extends CatalogShow {
  queue_show_id: string;
  queue_id: string;
  current_season: number | null;
  current_episode: number | null;
  archived: boolean;
  rating: number | null;
  review: string | null;
  is_private: boolean;
  recommended_by: string | null;
  recommended_by_email: string | null;
  recommendation_note: string | null;
  added_by: string | null;
  added_by_name: string | null;
  added_at: string;
}

/** @deprecated Use TrackedShow */
export type ShowRow = TrackedShow;
