"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { addShow } from "@/lib/shows/actions";
import { tmdbPoster } from "@/lib/tmdb/client";

interface Suggestion {
  tmdbId: number;
  mediaType: "show" | "movie";
  name: string;
  posterPath: string | null;
  date: string | null;
  overview: string | null;
  why: string;
  onSubscribedService: boolean;
}

interface DiscoverBoxProps {
  queueId: string;
  subscriptions: { providerId: number; providerName: string }[];
}

export function DiscoverBox({ queueId, subscriptions }: DiscoverBoxProps) {
  const [mood, setMood] = useState("");
  const [onlyMine, setOnlyMine] = useState(subscriptions.length > 0);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [someUnavailable, setSomeUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"thinking" | "checking">("thinking");
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [adding, startAdd] = useTransition();
  const [lastMood, setLastMood] = useState("");
  const [seenResults, setSeenResults] = useState<Suggestion[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood.trim()) return;

    const currentMood = mood.trim();
    const isRetry = currentMood === lastMood && results.length > 0;
    const seen = isRetry ? seenResults : [];

    setError(null);
    setResults([]);
    setSomeUnavailable(false);
    setLoading(true);
    setLoadingPhase("thinking");
    if (!isRetry) setAddedIds(new Set());

    // Switch loading message after a moment to reflect the availability-check phase
    const phaseTimer = setTimeout(() => setLoadingPhase("checking"), 2500);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: currentMood,
          onlySubscribed: onlyMine && subscriptions.length > 0,
          providerIds: onlyMine ? subscriptions.map((s) => s.providerId) : [],
          excludedTitles: seen.map((s) => s.name),
          excludedIds: seen.map((s) => s.tmdbId),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      if (data.results?.length > 0) {
        setResults(data.results);
        setSomeUnavailable(data.someUnavailable === true);
        setLastMood(currentMood);
        setSeenResults((prev) => isRetry ? [...prev, ...data.results] : data.results);
      } else {
        setError("No matches found. Try describing something different.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      clearTimeout(phaseTimer);
      setLoading(false);
    }
  }

  function onAdd(s: Suggestion) {
    startAdd(async () => {
      try {
        await addShow(queueId, s.tmdbId, s.mediaType);
        setAddedIds((prev) => new Set(prev).add(s.tmdbId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add.");
      }
    });
  }

  const examples = [
    "Something spooky from the 80s",
    "A feel-good comedy with dogs",
    "Intense thriller I can binge this weekend",
    "Animated movie for family movie night",
    "Slow-burn drama with great acting",
    "Sci-fi with a twist ending",
  ];

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <textarea
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="Describe what you're in the mood for..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)] resize-none text-sm"
          />
          {!mood && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setMood(ex)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[color:var(--accent)] transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {subscriptions.length > 0 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={onlyMine}
              onClick={() => setOnlyMine(!onlyMine)}
              className={`relative w-10 h-5 rounded-full transition-colors ${onlyMine ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${onlyMine ? "translate-x-5" : ""}`}
              />
            </button>
            <span className="text-[color:var(--muted)]">
              Only my streaming services
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading || !mood.trim()}
          className="px-4 py-3 rounded-md bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? "Thinking..." : "Suggest something"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-[color:var(--danger)] mt-4">{error}</p>
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[color:var(--muted)]">
            {loadingPhase === "thinking"
              ? "Finding the best matches for your mood…"
              : "Checking what's available on your services…"}
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-[color:var(--muted)] uppercase tracking-wider">
              We think you&apos;ll like
            </h2>
            {someUnavailable && onlyMine && (
              <span className="text-xs text-[color:var(--muted)] italic">
                Some picks aren&apos;t on your services
              </span>
            )}
          </div>
          {results.map((s) => {
            const poster = tmdbPoster(s.posterPath, "w185");
            const isAdded = addedIds.has(s.tmdbId);
            const showUnavailableBadge = onlyMine && !s.onSubscribedService;
            return (
              <div
                key={`${s.mediaType}:${s.tmdbId}`}
                className="flex gap-4 p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]"
              >
                <div className="w-20 h-[120px] relative flex-shrink-0 rounded overflow-hidden bg-[color:var(--surface-elevated)]">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={s.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[color:var(--muted)] p-1 text-center">
                      {s.name}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{s.name}</h3>
                    <span
                      className={`flex-shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${s.mediaType === "movie" ? "bg-blue-600/20 text-blue-400" : "bg-emerald-600/20 text-emerald-400"}`}
                    >
                      {s.mediaType === "movie" ? "Movie" : "TV"}
                    </span>
                    {s.date && (
                      <span className="text-xs text-[color:var(--muted)]">
                        {s.date.slice(0, 4)}
                      </span>
                    )}
                    {showUnavailableBadge && (
                      <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[color:var(--surface-elevated)] border border-[color:var(--border)] text-[color:var(--muted)]">
                        Not on your services
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[color:var(--accent)] mt-1">
                    {s.why}
                  </p>
                  {s.overview && (
                    <p className="text-xs text-[color:var(--muted)] line-clamp-2 mt-1.5 leading-relaxed">
                      {s.overview}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onAdd(s)}
                    disabled={adding || isAdded}
                    className="mt-3 px-4 py-1.5 rounded text-sm bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isAdded ? "Added to queue" : "Add to queue"}
                  </button>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              onSubmit(fakeEvent);
            }}
            disabled={loading}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] underline self-center mt-2"
          >
            Try again with the same mood
          </button>
        </div>
      )}
    </div>
  );
}
