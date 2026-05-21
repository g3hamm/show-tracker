import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const BATCH_SIZE = 10;
const MAX_ROUNDS = 3;

interface Suggestion {
  title: string;
  mediaType: "show" | "movie";
  why: string;
}

interface TmdbMatch {
  tmdbId: number;
  mediaType: "show" | "movie";
  name: string;
  posterPath: string | null;
  date: string | null;
  overview: string | null;
  why: string;
  onSubscribedService: boolean;
}

// ── TMDB helpers ──────────────────────────────────────────────────────────────

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

async function getProviderIds(
  tmdbId: number,
  mediaType: "show" | "movie",
  apiKey: string,
  region: string,
): Promise<Set<number>> {
  const endpoint = mediaType === "movie"
    ? `/movie/${tmdbId}/watch/providers`
    : `/tv/${tmdbId}/watch/providers`;

  const res = await fetch(`${TMDB_API_BASE}${endpoint}?api_key=${apiKey}`);
  if (!res.ok) return new Set();

  const data = await res.json();
  const regionData = data.results?.[region] ?? {};

  // Include flatrate, free, and ads tiers
  const allProviders = [
    ...(regionData.flatrate ?? []),
    ...(regionData.free ?? []),
    ...(regionData.ads ?? []),
  ] as { provider_id: number }[];

  return new Set(allProviders.map((p) => p.provider_id));
}

// ── Claude helpers ─────────────────────────────────────────────────────────────

async function askClaude(
  mood: string,
  count: number,
  excluded: string[],
  client: Anthropic,
): Promise<Suggestion[]> {
  const exclusionClause =
    excluded.length > 0
      ? `\n\nDo NOT suggest any of these titles (already recommended): ${excluded.join("; ")}.`
      : "";

  const systemPrompt = `You are a film and TV expert. The user will describe what they want to watch and you suggest exactly ${count} titles that best match their mood and description.

Rules:
- Suggest real, well-known titles only
- Use the exact official title as it appears on TMDB (The Movie Database)
- Be diverse: vary the era, tone, and sub-genre within the mood
- Include whether it's a "show" or "movie"
- Include a brief, friendly 1-sentence reason why it fits
- Respond ONLY with valid JSON, no other text${exclusionClause}

Response format:
[
  {"title": "exact title", "mediaType": "show" or "movie", "why": "one sentence reason"}
]`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: mood }],
  });

  const block = message.content[0];
  let text = block.type === "text" ? block.text : "";
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Invalid response format");
  return parsed as Suggestion[];
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 500 });
  }
  if (!tmdbKey) {
    return NextResponse.json({ error: "TMDB_API_KEY is not configured." }, { status: 500 });
  }

  const body = await request.json();
  const mood: string = (body.mood || "").trim();
  const subscribedProviderIds: number[] = body.providerIds || [];
  const onlySubscribed: boolean = body.onlySubscribed === true && subscribedProviderIds.length > 0;
  const region = process.env.WATCH_REGION ?? "US";

  if (!mood || mood.length > 500) {
    return NextResponse.json(
      { error: "Please describe what you're in the mood for (max 500 chars)." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey: anthropicKey });
  const subscribedSet = new Set(subscribedProviderIds);

  // ── Fast path: no streaming filter ──────────────────────────────────────────
  if (!onlySubscribed) {
    const suggestions = await askClaude(mood, 3, [], client);
    const results: TmdbMatch[] = [];

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
            onSubscribedService: false,
          });
        }
      }),
    );

    return NextResponse.json({ results });
  }

  // ── Streaming-filtered path: iterate until we have 3 available results ──────
  const available: TmdbMatch[] = [];
  const fallback: TmdbMatch[] = [];
  const triedTitles: string[] = [];

  for (let round = 0; round < MAX_ROUNDS && available.length < 3; round++) {
    const suggestions = await askClaude(mood, BATCH_SIZE, triedTitles, client);
    triedTitles.push(...suggestions.map((s) => s.title));

    // Resolve TMDB IDs and provider availability in parallel
    const resolved = await Promise.all(
      suggestions.map(async (s) => {
        const match = await tmdbSearch(s.title, s.mediaType, tmdbKey);
        if (!match) return null;

        const titleProviderIds = await getProviderIds(match.id, s.mediaType, tmdbKey, region);
        const isAvailable = [...titleProviderIds].some((id) => subscribedSet.has(id));

        return {
          tmdbId: match.id,
          mediaType: s.mediaType,
          name: match.name,
          posterPath: match.poster_path,
          date: match.date,
          overview: match.overview,
          why: s.why,
          onSubscribedService: isAvailable,
        } satisfies TmdbMatch;
      }),
    );

    for (const r of resolved) {
      if (!r) continue;
      if (r.onSubscribedService && available.length < 3) {
        available.push(r);
      } else if (!r.onSubscribedService && fallback.length < 3) {
        fallback.push(r);
      }
    }
  }

  // Return up to 3 available results; if fewer found, pad with best non-available picks
  const results = [...available];
  for (const fb of fallback) {
    if (results.length >= 3) break;
    results.push(fb);
  }

  return NextResponse.json({ results, someUnavailable: available.length < results.length });
}
