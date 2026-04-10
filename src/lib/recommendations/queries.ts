import { getTurso } from "@/lib/turso/client";

export interface RecommendationRow {
  id: string;
  media_type: string;
  tmdb_id: number | null;
  title: string;
  poster_path: string | null;
  recommender_name: string;
  note: string | null;
  created_at: string;
}

export async function listRecommendations(): Promise<RecommendationRow[]> {
  const result = await getTurso().execute(
    "SELECT * FROM recommendations WHERE media_type = 'show' ORDER BY created_at DESC",
  );
  return result.rows.map((r) => ({
    id: r.id as string,
    media_type: r.media_type as string,
    tmdb_id: r.tmdb_id as number | null,
    title: r.title as string,
    poster_path: r.poster_path as string | null,
    recommender_name: r.recommender_name as string,
    note: r.note as string | null,
    created_at: r.created_at as string,
  }));
}
