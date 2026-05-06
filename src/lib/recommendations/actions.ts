"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { getTurso } from "@/lib/turso/client";
import { tmdbSearchTv, tmdbSearchMovie } from "@/lib/tmdb/client";
import { getQueueByShareCode } from "@/lib/families/queries";
import { emailEnabled, getResend } from "@/lib/email/client";
import { newRecommendationEmail } from "@/lib/email/templates";

// --- Public search (used on /recommend, no auth) ---

export interface PublicSearchResult {
  tmdbId: number;
  mediaType: "show" | "movie";
  name: string;
  posterPath: string | null;
  date: string | null;
  overview: string | null;
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

  const [tvRes, movieRes] = await Promise.all([
    tmdbSearchTv(q),
    tmdbSearchMovie(q),
  ]);

  const tvResults: PublicSearchResult[] = tvRes.results.slice(0, 5).map((r) => ({
    tmdbId: r.id,
    mediaType: "show" as const,
    name: r.name,
    posterPath: r.poster_path,
    date: r.first_air_date,
    overview: r.overview || null,
  }));

  const movieResults: PublicSearchResult[] = movieRes.results.slice(0, 5).map((r) => ({
    tmdbId: r.id,
    mediaType: "movie" as const,
    name: r.title,
    posterPath: r.poster_path,
    date: r.release_date,
    overview: r.overview || null,
  }));

  return [...tvResults, ...movieResults];
}

// --- Public recommendation submission ---

export interface RecommendInput {
  recommenderName: string;
  recommenderEmail?: string;
  title: string;
  mediaType?: "show" | "movie";
  tmdbId?: number | null;
  posterPath?: string | null;
  overview?: string | null;
  note?: string;
  website?: string;
  elapsedMs?: number;
  queueShareCode?: string;
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
  const email = (input.recommenderEmail || "").trim();
  const title = (input.title || "").trim();
  const note = (input.note || "").trim();

  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "Please enter your name (1-60 characters)." };
  }
  if (title.length < 1 || title.length > 200) {
    return { ok: false, error: "Please enter a title." };
  }
  if (note.length > 1000) {
    return { ok: false, error: "Note is too long (max 1000 characters)." };
  }
  if (email.length > 0 && !email.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (input.tmdbId == null) {
    return { ok: false, error: "Please select a show or movie from the search results." };
  }

  const ip = await getIp();
  if (!rateLimitSubmit(ip)) {
    return {
      ok: false,
      error: "Too many submissions from this network. Try again later.",
    };
  }

  const mediaType = input.mediaType ?? "show";

  let queueId: string | null = null;
  if (input.queueShareCode) {
    const queue = await getQueueByShareCode(input.queueShareCode);
    if (queue) queueId = queue.id;
  }

  try {
    const id = crypto.randomUUID();
    await getTurso().execute({
      sql: `INSERT INTO recommendations (id, queue_id, media_type, tmdb_id, title, poster_path, recommender_name, recommender_email, note, overview)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, queueId, mediaType,
        input.tmdbId ?? null,
        title,
        input.posterPath ?? null,
        name,
        email.length > 0 ? email : null,
        note.length > 0 ? note : null,
        input.overview ?? null,
      ],
    });
  } catch {
    return { ok: false, error: "Could not save your recommendation." };
  }

  // Send notification email to owner (fire-and-forget)
  const notifyEmail = process.env.NOTIFICATION_EMAIL;
  if (emailEnabled() && notifyEmail) {
    const fromEmail = process.env.RESEND_FROM ?? "Chillflix <onboarding@resend.dev>";
    const { subject, html } = newRecommendationEmail({
      recommenderName: name,
      title,
      mediaType,
      note: note.length > 0 ? note : null,
      overview: input.overview ?? null,
    });
    getResend()
      .emails.send({ from: fromEmail, to: notifyEmail, subject, html })
      .catch(() => {});
  }

  revalidatePath("/");
  return { ok: true };
}

// --- Public: get tracked/watched TMDB IDs (for "watched" overlay) ---

export interface TrackedShowInfo {
  tmdbId: number;
  mediaType: string;
  archived: boolean;
}

export async function getTrackedShowsPublic(queueShareCode?: string): Promise<TrackedShowInfo[]> {
  let queueId: string | null = null;
  if (queueShareCode) {
    const queue = await getQueueByShareCode(queueShareCode);
    if (queue) queueId = queue.id;
  }

  if (!queueId) return [];

  const result = await getTurso().execute({
    sql: `SELECT s.tmdb_id, s.media_type,
                 CASE WHEN SUM(CASE WHEN qs.archived = 0 THEN 1 ELSE 0 END) > 0 THEN 0 ELSE 1 END as archived
          FROM shows s
          JOIN queue_shows qs ON s.id = qs.show_id
          WHERE s.tmdb_id IS NOT NULL AND qs.private = 0 AND qs.queue_id = ?
          GROUP BY s.tmdb_id, s.media_type`,
    args: [queueId],
  });
  return result.rows.map((r) => ({
    tmdbId: r.tmdb_id as number,
    mediaType: r.media_type as string,
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
