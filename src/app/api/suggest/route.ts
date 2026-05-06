import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

const TMDB_API_BASE = "https://api.themoviedb.org/3";

interface Suggestion {
  title: string;
  mediaType: "show" | "movie";
  why: string;
}

interface TmdbResult {
  tmdbId: number;
  mediaType: "show" | "movie";
  name: string;
  posterPath: string | null;
  date: string | null;
  overview: string | null;
  why: string;
}

async function tmdbSearch(
  title: string,
  mediaType: "show" | "movie",
  apiKey: string,
): Promise<{ id: number; name: string; poster_path: string | null; date: string | null; overview: string | null } | null> {
  const endpoint = mediaType === "movie" ? "/search/movie" : "/search/tv";
  const url = new URL(TMDB_API_BASE + endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", title);
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  const first = data.results?.[0];
  if (!first) return null;

  return {
    id: first.id,
    name: mediaType === "movie" ? first.title : first.name,
    poster_path: first.poster_path,
    date: mediaType === "movie" ? first.release_date : first.first_air_date,
    overview: first.overview || null,
  };
}

async function tmdbDiscover(
  mediaType: "show" | "movie",
  providerIds: number[],
  apiKey: string,
): Promise<{ id: number; name: string; poster_path: string | null; date: string | null; overview: string | null }[]> {
  const endpoint = mediaType === "movie" ? "/discover/movie" : "/discover/tv";
  const region = process.env.WATCH_REGION ?? "US";
  const url = new URL(TMDB_API_BASE + endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("watch_region", region);
  url.searchParams.set("with_watch_providers", providerIds.join("|"));
  url.searchParams.set("with_watch_monetization_types", "flatrate");
  url.searchParams.set("sort_by", "popularity.desc");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).slice(0, 20).map((r: Record<string, unknown>) => ({
    id: r.id as number,
    name: (mediaType === "movie" ? r.title : r.name) as string,
    poster_path: r.poster_path as string | null,
    date: (mediaType === "movie" ? r.release_date : r.first_air_date) as string | null,
    overview: (r.overview as string) || null,
  }));
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!anthropicKey || !tmdbKey) {
    return NextResponse.json({ error: "API keys not configured" }, { status: 500 });
  }

  const body = await request.json();
  const mood: string = (body.mood || "").trim();
  const providerIds: number[] = body.providerIds || [];
  const onlySubscribed: boolean = body.onlySubscribed === true;

  if (!mood || mood.length > 500) {
    return NextResponse.json({ error: "Please describe what you're in the mood for (max 500 chars)." }, { status: 400 });
  }

  let availableTitles = "";
  if (onlySubscribed && providerIds.length > 0) {
    const [tvResults, movieResults] = await Promise.all([
      tmdbDiscover("show", providerIds, tmdbKey),
      tmdbDiscover("movie", providerIds, tmdbKey),
    ]);
    const titles = [
      ...tvResults.map((r) => `TV: ${r.name}`),
      ...movieResults.map((r) => `Movie: ${r.name}`),
    ];
    availableTitles = `\n\nHere are some popular titles currently available on the user's streaming services. You may suggest from this list or suggest other titles that are commonly available on major streaming platforms:\n${titles.join("\n")}`;
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  const systemPrompt = `You are a movie and TV show recommendation engine. The user will describe what they're in the mood for, and you suggest exactly 3 titles that match.

Rules:
- Suggest real, well-known movies and TV shows only
- Each suggestion must include the exact official title as it would appear on TMDB (The Movie Database)
- Include whether it's a "show" or "movie"
- Include a brief, friendly 1-sentence reason why it matches their mood
- Respond ONLY with valid JSON, no other text${availableTitles}

Response format:
[
  {"title": "exact title", "mediaType": "show" or "movie", "why": "one sentence reason"},
  {"title": "exact title", "mediaType": "show" or "movie", "why": "one sentence reason"},
  {"title": "exact title", "mediaType": "show" or "movie", "why": "one sentence reason"}
]`;

  let suggestions: Suggestion[];
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: mood }],
    });

    const block = message.content[0];
    const text = block.type === "text" ? block.text : "";
    suggestions = JSON.parse(text);

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("Invalid response format");
    }
  } catch {
    return NextResponse.json({ error: "Could not generate suggestions. Try again." }, { status: 500 });
  }

  const results: TmdbResult[] = [];
  await Promise.all(
    suggestions.slice(0, 3).map(async (s) => {
      const match = await tmdbSearch(s.title, s.mediaType, tmdbKey);
      if (match) {
        results.push({
          tmdbId: match.id,
          mediaType: s.mediaType,
          name: match.name,
          posterPath: match.poster_path,
          date: match.date,
          overview: match.overview,
          why: s.why,
        });
      }
    }),
  );

  return NextResponse.json({ results });
}
