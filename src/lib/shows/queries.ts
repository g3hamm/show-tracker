import { createClient } from "@/lib/supabase/server";
import { addDays, todayInAppTz } from "@/lib/dates";
import type { ShowRow } from "./types";

// How far ahead the "Coming soon" section looks.
export const COMING_SOON_DAYS = 14;
// How far back the "New this week" section looks.
export const NEW_THIS_WEEK_DAYS = 7;

const SHOWS_SELECT = `
  id,
  media_type,
  tmdb_id,
  name,
  poster_path,
  backdrop_path,
  overview,
  status,
  first_air_date,
  next_episode,
  last_episode,
  next_air_date,
  last_air_date,
  archived,
  last_refreshed_at,
  added_by,
  created_at,
  profiles:added_by ( display_name )
`;

type RawShowRow = Omit<ShowRow, "added_by_name"> & {
  profiles: { display_name: string | null } | null;
};

function flatten(row: RawShowRow): ShowRow {
  const { profiles, ...rest } = row;
  return {
    ...rest,
    added_by_name: profiles?.display_name ?? null,
  };
}

// NOTE: We don't share a "base query" helper because PostgrestFilterBuilder
// is thenable, so `await` on it triggers execution. Each function constructs
// its own builder chain instead.

export async function getNewThisWeek(): Promise<ShowRow[]> {
  const supabase = await createClient();
  const today = todayInAppTz();
  const weekAgo = addDays(today, -(NEW_THIS_WEEK_DAYS - 1));
  const { data, error } = await supabase
    .from("shows")
    .select(SHOWS_SELECT)
    .eq("media_type", "show")
    .eq("archived", false)
    .gte("last_air_date", weekAgo)
    .lte("last_air_date", today)
    .order("last_air_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => flatten(r as unknown as RawShowRow));
}

export async function getComingSoon(): Promise<ShowRow[]> {
  const supabase = await createClient();
  const today = todayInAppTz();
  const horizon = addDays(today, COMING_SOON_DAYS);
  const { data, error } = await supabase
    .from("shows")
    .select(SHOWS_SELECT)
    .eq("media_type", "show")
    .eq("archived", false)
    .gte("next_air_date", today)
    .lte("next_air_date", horizon)
    .order("next_air_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => flatten(r as unknown as RawShowRow));
}

export async function getAllTrackedShows(
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<ShowRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("shows")
    .select(SHOWS_SELECT)
    .eq("media_type", "show");
  if (!includeArchived) {
    query = query.eq("archived", false);
  }
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => flatten(r as unknown as RawShowRow));
}

export async function getShowById(id: string): Promise<ShowRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shows")
    .select(SHOWS_SELECT)
    .eq("media_type", "show")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return flatten(data as unknown as RawShowRow);
}
