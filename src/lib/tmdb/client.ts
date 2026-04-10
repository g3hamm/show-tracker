import type { TmdbSearchTvResponse, TmdbTvDetails, TmdbSearchMovieResponse, TmdbMovieDetails } from "./types";

// Hard-coded image base URL. TMDB's /configuration endpoint is overkill.
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const API_BASE = "https://api.themoviedb.org/3";

async function tmdb<T>(
  path: string,
  params: Record<string, string> = {},
  { revalidate = 3600 }: { revalidate?: number } = {},
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }

  const url = new URL(API_BASE + path);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status} ${res.statusText}: ${body}`);
  }

  return (await res.json()) as T;
}

export function tmdbSearchTv(query: string) {
  return tmdb<TmdbSearchTvResponse>("/search/tv", {
    query,
    include_adult: "false",
  });
}

export function tmdbGetTv(tmdbId: number) {
  // Bypass cache on refresh to get fresh episode data.
  return tmdb<TmdbTvDetails>(
    `/tv/${tmdbId}`,
    { append_to_response: "external_ids" },
    { revalidate: 0 },
  );
}

export function tmdbSearchMovie(query: string) {
  return tmdb<TmdbSearchMovieResponse>("/search/movie", {
    query,
    include_adult: "false",
  });
}

export function tmdbGetMovie(tmdbId: number) {
  return tmdb<TmdbMovieDetails>(
    `/movie/${tmdbId}`,
    {},
    { revalidate: 0 },
  );
}

export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";

export function tmdbPoster(
  path: string | null | undefined,
  size: PosterSize = "w342",
): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}
