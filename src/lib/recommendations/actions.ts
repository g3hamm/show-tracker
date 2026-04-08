"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tmdbSearchTv } from "@/lib/tmdb/client";
import type { TmdbSearchTvResult } from "@/lib/tmdb/types";

// --- Public search (used on /recommend, no auth) ---

export interface PublicSearchResult {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  firstAirDate: string | null;
}

function trim(r: TmdbSearchTvResult): PublicSearchResult {
  return {
    tmdbId: r.id,
    name: r.name,
    posterPath: r.poster_path,
    firstAirDate: r.first_air_date,
  };
}

// In-memory rate limiter for the public search endpoint.
// Per-IP rolling window: max 30 searches per minute.
const searchHits = new Map<string, number[]>();
const SEARCH_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;

function rateLimitSearch(ip: string): boolean {
  const now = Date.now();
  const hits = (searchHits.get(ip) ?? []).filter(
    (t) => now - t < SEARCH_WINDOW_MS,
  );
  if (hits.length >= SEARCH_LIMIT) {
    searchHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  searchHits.set(ip, hits);
  return true;
}

async function getIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function publicSearchShows(
  query: string,
): Promise<PublicSearchResult[]> {
  const ip = await getIp();
  if (!rateLimitSearch(ip)) {
    throw new Error("Too many searches. Please try again in a minute.");
  }
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await tmdbSearchTv(q);
  return res.results.slice(0, 10).map(trim);
}

// --- Public recommendation submission ---

export interface RecommendInput {
  recommenderName: string;
  title: string;
  tmdbId?: number | null;
  posterPath?: string | null;
  note?: string;
  // Honeypot: must be empty.
  website?: string;
  // Milliseconds since form mount; must be >= MIN_FILL_MS.
  elapsedMs?: number;
}

export interface RecommendResult {
  ok: boolean;
  error?: string;
}

const MIN_FILL_MS = 2000;
const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const submitHits = new Map<string, number[]>();

function rateLimitSubmit(ip: string): boolean {
  const now = Date.now();
  const hits = (submitHits.get(ip) ?? []).filter(
    (t) => now - t < SUBMIT_WINDOW_MS,
  );
  if (hits.length >= SUBMIT_LIMIT) {
    submitHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  submitHits.set(ip, hits);
  return true;
}

export async function submitRecommendation(
  input: RecommendInput,
): Promise<RecommendResult> {
  // Honeypot: bots that fill every field trip this.
  if (input.website && input.website.length > 0) {
    return { ok: true }; // pretend success so bots don't know
  }

  // Time gate: humans take more than 2s to fill the form.
  if (typeof input.elapsedMs === "number" && input.elapsedMs < MIN_FILL_MS) {
    return { ok: true };
  }

  // Basic validation.
  const name = (input.recommenderName || "").trim();
  const title = (input.title || "").trim();
  const note = (input.note || "").trim();

  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "Please enter your name (1-60 characters)." };
  }
  if (title.length < 1 || title.length > 200) {
    return { ok: false, error: "Please enter a show title." };
  }
  if (note.length > 1000) {
    return { ok: false, error: "Note is too long (max 1000 characters)." };
  }

  // Rate limit.
  const ip = await getIp();
  if (!rateLimitSubmit(ip)) {
    return {
      ok: false,
      error: "Too many submissions from this network. Try again later.",
    };
  }

  // Insert via admin client (bypasses RLS — anonymous users can't insert
  // via PostgREST). All validation has already happened above.
  const admin = createAdminClient();
  const { error } = await admin.from("recommendations").insert({
    media_type: "show",
    tmdb_id: input.tmdbId ?? null,
    title,
    poster_path: input.posterPath ?? null,
    recommender_name: name,
    note: note.length > 0 ? note : null,
  });

  if (error) {
    return { ok: false, error: "Could not save your recommendation." };
  }

  revalidatePath("/");
  return { ok: true };
}

// --- Dismiss (authenticated) ---

export async function dismissRecommendation(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("recommendations").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}
