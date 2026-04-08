"use client";

import Image from "next/image";
import { useState, useTransition, useRef, useEffect } from "react";
import { searchShows, addShow, type SearchResult } from "@/lib/shows/actions";
import { tmdbPoster } from "@/lib/tmdb/client";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [adding, startAdd] = useTransition();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        try {
          const res = await searchShows(q);
          setResults(res);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Search failed");
        }
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function onAdd(tmdbId: number) {
    startAdd(async () => {
      try {
        await addShow(tmdbId);
        setAddedIds((prev) => new Set(prev).add(tmdbId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Add failed");
      }
    });
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search for a show..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        className="w-full px-4 py-3 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)] mb-4"
      />
      {error && <p className="text-sm text-[color:var(--danger)] mb-3">{error}</p>}
      {searching && (
        <p className="text-sm text-[color:var(--muted)]">Searching…</p>
      )}
      <ul className="flex flex-col gap-2">
        {results.map((r) => {
          const poster = tmdbPoster(r.posterPath, "w185");
          const isAdded = addedIds.has(r.tmdbId);
          return (
            <li
              key={r.tmdbId}
              className="flex gap-3 p-3 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]"
            >
              <div className="w-16 h-24 relative flex-shrink-0 rounded overflow-hidden bg-[color:var(--surface-elevated)]">
                {poster && (
                  <Image
                    src={poster}
                    alt={r.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-medium truncate">{r.name}</h3>
                  {r.firstAirDate && (
                    <span className="text-xs text-[color:var(--muted)]">
                      {r.firstAirDate.slice(0, 4)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[color:var(--muted)] line-clamp-2 mt-1">
                  {r.overview || "No description."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(r.tmdbId)}
                disabled={adding || isAdded}
                className="self-start px-3 py-1.5 rounded text-sm bg-[color:var(--accent)] text-black font-medium disabled:opacity-60"
              >
                {isAdded ? "Added" : adding ? "…" : "Add"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
