import { createAdminClient } from "@/lib/supabase/admin";

// Public-facing show data for the /recommend page.
// Uses the admin client since the page is unauthenticated.

export interface PublicShowRow {
  name: string;
  poster_path: string | null;
  tmdb_id: number | null;
  current_season: number | null;
  current_episode: number | null;
  archived: boolean;
}

export async function getPublicWatchlist(): Promise<PublicShowRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shows")
    .select("name, poster_path, tmdb_id, current_season, current_episode, archived")
    .eq("media_type", "show")
    .eq("archived", false)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PublicShowRow[];
}

export async function getWatchedTmdbIds(): Promise<Set<number>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shows")
    .select("tmdb_id")
    .eq("media_type", "show")
    .eq("archived", true)
    .not("tmdb_id", "is", null);
  if (error) throw error;
  return new Set((data ?? []).map((r: { tmdb_id: number }) => r.tmdb_id));
}

export async function getTrackedTmdbIds(): Promise<Set<number>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shows")
    .select("tmdb_id, archived")
    .eq("media_type", "show")
    .not("tmdb_id", "is", null);
  if (error) throw error;
  return new Set((data ?? []).map((r: { tmdb_id: number }) => r.tmdb_id));
}
