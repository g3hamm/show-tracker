"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useTransition } from "react";
import {
  publicSearchShows,
  submitRecommendation,
  getTrackedShowsPublic,
  type PublicSearchResult,
  type TrackedShowInfo,
} from "@/lib/recommendations/actions";
import { tmdbPoster } from "@/lib/tmdb/client";

interface RecommendFormProps {
  defaultName?: string;
}

export function RecommendForm({ defaultName }: RecommendFormProps) {
  const [name, setName] = useState(defaultName ?? "");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [picked, setPicked] = useState<PublicSearchResult | null>(null);
  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedShows, setTrackedShows] = useState<TrackedShowInfo[]>([]);
  const mountedAt = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
    getTrackedShowsPublic().then(setTrackedShows).catch(() => {});
  }, []);

  useEffect(() => {
    if (picked && picked.name === title) return; // already locked in
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = title.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        try {
          const res = await publicSearchShows(q);
          setResults(res);
        } catch {
          // Silent fail — typed title still works.
          setResults([]);
        }
      });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, picked]);

  function onPick(r: PublicSearchResult) {
    setPicked(r);
    setTitle(r.name);
    setResults([]);
  }

  function onClear() {
    setPicked(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startSubmit(async () => {
      const result = await submitRecommendation({
        recommenderName: name,
        title,
        tmdbId: picked?.tmdbId ?? null,
        posterPath: picked?.posterPath ?? null,
        note,
        website,
        elapsedMs: Date.now() - mountedAt.current,
      });
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="p-6 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
        <h2 className="text-lg font-semibold">Thanks!</h2>
        <p className="text-sm text-[color:var(--muted)] mt-2">
          Your recommendation is in. We&apos;ll see it on the dashboard next time
          we log in.
        </p>
        <button
          type="button"
          onClick={() => {
            setName("");
            setTitle("");
            setNote("");
            setPicked(null);
            setSubmitted(false);
          }}
          className="mt-4 text-sm underline hover:text-[color:var(--accent)]"
        >
          Recommend another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Honeypot: hidden from humans, filled by naive bots. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          visibility: "hidden",
        }}
      >
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label className="block text-xs text-[color:var(--muted)] mb-1">
          Your name
        </label>
        <input
          type="text"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          className="w-full px-4 py-3 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-xs text-[color:var(--muted)] mb-1">
          Show title
        </label>
        <input
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (picked && e.target.value !== picked.name) setPicked(null);
          }}
          placeholder="Start typing..."
          className="w-full px-4 py-3 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)]"
        />
        {picked && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--muted)]">
            <span>
              Locked in: <span className="text-[color:var(--foreground)]">{picked.name}</span>
              {picked.firstAirDate && ` (${picked.firstAirDate.slice(0, 4)})`}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="underline hover:text-[color:var(--foreground)]"
            >
              clear
            </button>
          </div>
        )}
        {!picked && results.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 max-h-64 overflow-auto rounded-md border border-[color:var(--border)] bg-[color:var(--surface)]">
            {results.map((r) => {
              const poster = tmdbPoster(r.posterPath, "w92");
              const tracked = trackedShows.find((t) => t.tmdbId === r.tmdbId);
              const isWatched = tracked?.archived === true;
              const isTracking = tracked != null && !tracked.archived;
              return (
                <li key={r.tmdbId}>
                  <button
                    type="button"
                    onClick={() => onPick(r)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-[color:var(--surface-elevated)] text-left"
                  >
                    <div className="w-8 h-12 relative flex-shrink-0 rounded overflow-hidden bg-[color:var(--surface-elevated)]">
                      {poster && (
                        <Image
                          src={poster}
                          alt=""
                          fill
                          sizes="32px"
                          className={`object-cover${isWatched ? " opacity-40" : ""}`}
                        />
                      )}
                      {isWatched && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                            Watched
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {r.name}
                        {isWatched && (
                          <span className="ml-2 text-[10px] text-[color:var(--muted)] font-medium">
                            Already watched
                          </span>
                        )}
                        {isTracking && (
                          <span className="ml-2 text-[10px] text-emerald-400 font-medium">
                            Currently watching
                          </span>
                        )}
                      </p>
                      {r.firstAirDate && (
                        <p className="text-[10px] text-[color:var(--muted)]">
                          {r.firstAirDate.slice(0, 4)}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!picked && searching && (
          <p className="text-[10px] text-[color:var(--muted)] mt-1">Searching…</p>
        )}
      </div>

      <div>
        <label className="block text-xs text-[color:var(--muted)] mb-1">
          Why should we watch it? <span className="opacity-60">(optional)</span>
        </label>
        <textarea
          maxLength={1000}
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Loved the writing..."
          className="w-full px-4 py-3 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-3 rounded-md bg-[color:var(--accent)] text-black font-medium disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send recommendation"}
      </button>
      {error && <p className="text-sm text-[color:var(--danger)]">{error}</p>}
      <p className="text-[10px] text-[color:var(--muted)] text-center">
        <Link href="/login" className="underline hover:text-[color:var(--foreground)]">
          Tracker sign-in
        </Link>
      </p>
    </form>
  );
}
