"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tmdbSearchTv, tmdbGetTv } from "@/lib/tmdb/client";
import { mapTvDetailsToRow } from "@/lib/tmdb/mappers";
import type { TmdbSearchTvResult } from "@/lib/tmdb/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return { supabase, user };
}

export interface SearchResult {
  tmdbId: number;
  name: string;
  overview: string;
  posterPath: string | null;
  firstAirDate: string | null;
}

function trimSearchResult(r: TmdbSearchTvResult): SearchResult {
  return {
    tmdbId: r.id,
    name: r.name,
    overview: r.overview,
    posterPath: r.poster_path,
    firstAirDate: r.first_air_date,
  };
}

export async function searchShows(query: string): Promise<SearchResult[]> {
  await requireUser();
  const q = query.trim();
  if (!q) return [];
  const res = await tmdbSearchTv(q);
  return res.results.slice(0, 20).map(trimSearchResult);
}

export async function addShow(tmdbId: number): Promise<void> {
  const { supabase, user } = await requireUser();
  const details = await tmdbGetTv(tmdbId);
  const row = mapTvDetailsToRow(details);
  const { error } = await supabase
    .from("shows")
    .upsert(
      { ...row, added_by: user.id },
      { onConflict: "tmdb_id" },
    );
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/search");
}

export async function removeShow(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("shows").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

export async function archiveShow(id: string, archived: boolean): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("shows")
    .update({ archived })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

// Shared refresh implementation used by both the cron endpoint (service role)
// and the "Refresh now" button (user). Accepts a Supabase client so both
// contexts can reuse the logic.
type MinimalSupabase = ReturnType<typeof createAdminClient>;

export async function refreshAllWithClient(
  client: MinimalSupabase,
): Promise<{ refreshed: number; failed: number }> {
  const { data: shows, error } = await client
    .from("shows")
    .select("id, tmdb_id")
    .eq("media_type", "show")
    .not("tmdb_id", "is", null);
  if (error) throw error;

  let refreshed = 0;
  let failed = 0;

  // Process in small chunks to be polite to TMDB.
  const CHUNK = 5;
  const all = shows ?? [];
  for (let i = 0; i < all.length; i += CHUNK) {
    const batch = all.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      batch.map(async (s) => {
        if (s.tmdb_id == null) return;
        const details = await tmdbGetTv(s.tmdb_id);
        const row = mapTvDetailsToRow(details);
        const { error: updateErr } = await client
          .from("shows")
          .update(row)
          .eq("id", s.id);
        if (updateErr) throw updateErr;
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") refreshed += 1;
      else failed += 1;
    }
  }

  return { refreshed, failed };
}

export async function updateProgress(
  id: string,
  season: number | null,
  episode: number | null,
): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("shows")
    .update({ current_season: season, current_episode: episode })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath(`/show/${id}`);
}

export async function refreshAll(): Promise<{ refreshed: number; failed: number }> {
  await requireUser();
  // Use the admin client so one user click updates everyone's shared list
  // without RLS quirks (every policy is already permissive, but this keeps
  // parity with the cron path).
  const admin = createAdminClient();
  const result = await refreshAllWithClient(admin);
  revalidatePath("/");
  return result;
}
