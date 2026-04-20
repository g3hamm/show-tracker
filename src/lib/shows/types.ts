import type { TmdbEpisode } from "@/lib/tmdb/types";

// Shape of a row read from the shows table, enriched with the added-by display name.
export interface ShowRow {
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
  current_season: number | null;
  current_episode: number | null;
  archived: boolean;
  rating: number | null;
  review: string | null;
  last_refreshed_at: string;
  recommended_by: string | null;
  recommended_by_email: string | null;
  added_by: string | null;
  created_at: string;
  added_by_name: string | null;
}
