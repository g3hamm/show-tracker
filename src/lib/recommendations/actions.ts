"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { getTurso } from "@/lib/turso/client";
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
  website?: string;
  elapsedMs?: number;
}

export interface RecommendResult {
  ok: boolean;
  error?: string;
}

const MIN_FILL_MS = 2000;
const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;

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
  if (input.website && input.website.length > 0) {
    return { ok: true };
  }

  if (typeof input.elapsedMs === "number" && input.elapsedMs < MIN_FILL_MS) {
    return { ok: true };
  }

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

  const ip = await getIp();
  if (!rateLimitSubmit(ip)) {
    return {
      ok: false,
      error: "Too many submissions from this network. Try again later.",
    };
  }

  try {
    const id = crypto.randomUUID();
    await getTurso().execute({
      sql: `INSERT INTO recommendations (id, media_type, tmdb_id, title, poster_path, recommender_name, note)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, "show",
        input.tmdbId ?? null,
        title,
        input.posterPath ?? null,
        name,
        note.length > 0 ? note : null,
      ],
    });
  } catch {
    return { ok: false, error: "Could not save your recommendation." };
  }

  revalidatePath("/");
  return { ok: true };
}

// --- Public: get tracked/watched TMDB IDs (for "watched" overlay) ---

export interface TrackedShowInfo {
  tmdbId: number;
  archived: boolean;
}

export async function getTrackedShowsPublic(): Promise<TrackedShowInfo[]> {
  const result = await getTurso().execute(
    "SELECT tmdb_id, archived FROM shows WHERE media_type = 'show' AND tmdb_id IS NOT NULL",
  );
  return result.rows.map((r) => ({
    tmdbId: r.tmdb_id as number,
    archived: (r.archived as number) === 1,
  }));
}

// --- Dismiss (authenticated) ---

export async function dismissRecommendation(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  await getTurso().execute({
    sql: "DELETE FROM recommendations WHERE id = ?",
    args: [id],
  });
  revalidatePath("/");
}
