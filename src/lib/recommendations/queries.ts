import { getTurso } from "@/lib/turso/client";

export interface RecommendationRow {
  id: string;
  media_type: string;
  tmdb_id: number | null;
  title: string;
  poster_path: string | null;
  recommender_name: string;
  recommender_email: string | null;
  note: string | null;
  overview: string | null;
  created_at: string;
}

export async function listRecommendations(queueId?: string): Promise<RecommendationRow[]> {
  const result = queueId
    ? await getTurso().execute({
        sql: "SELECT * FROM recommendations WHERE queue_id = ? OR queue_id IS NULL ORDER BY created_at DESC",
        args: [queueId],
      })
    : await getTurso().execute(
        "SELECT * FROM recommendations ORDER BY created_at DESC",
      );
  return result.rows.map((r) => ({
    id: r.id as string,
    media_type: r.media_type as string,
    tmdb_id: r.tmdb_id as number | null,
    title: r.title as string,
    poster_path: r.poster_path as string | null,
    recommender_name: r.recommender_name as string,
    recommender_email: r.recommender_email as string | null,
    note: r.note as string | null,
    overview: r.overview as string | null,
    created_at: r.created_at as string,
  }));
}
