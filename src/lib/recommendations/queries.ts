import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recommendations")
    .select(
      "id, media_type, tmdb_id, title, poster_path, recommender_name, note, created_at",
    )
    .eq("media_type", "show")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RecommendationRow[];
}
