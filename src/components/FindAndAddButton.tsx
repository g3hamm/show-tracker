"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { searchShows, addShow, type SearchResult } from "@/lib/shows/actions";
import { dismissRecommendation } from "@/lib/recommendations/actions";
import { tmdbPoster } from "@/lib/tmdb/client";

export function FindAndAddButton({
  queueId,
  title,
  recommenderName,
  recommenderEmail,
  recommendationNote,
  recommendationId,
}: {
  queueId: string;
  title: string;
  recommenderName: string;
  recommenderEmail: string | null;
  recommendationNote: string | null;
  recommendationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [adding, startAdd] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onFind() {
    setErr(null);
    setOpen(true);
    startSearch(async () => {
      try {
        const res = await searchShows(title);
        setResults(res);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Search failed");
      }
    });
  }

  function onPick(result: SearchResult) {
    setErr(null);
    startAdd(async () => {
      try {
        await addShow(
          queueId,
          result.tmdbId,
          result.mediaType,
          recommenderName,
          recommenderEmail,
          recommendationNote,
        );
        await dismissRecommendation(recommendationId);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to add");
      }
    });
  }

  if (!open) {
    return (
      <>
        <button
          type="button"
          onClick={onFind}
          className="text-[11px] px-2 py-1 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors"
        >
          Find & add
        </button>
        {err && (
          <span className="text-[10px] text-[color:var(--danger)]">{err}</span>
        )}
      </>
    );
  }

  return (
    <div className="w-full">
      {searching ? (
        <p className="text-[10px] text-[color:var(--muted)]">
          Searching TMDB for &ldquo;{title}&rdquo;…
        </p>
      ) : results.length === 0 ? (
        <div>
          <p className="text-[10px] text-[color:var(--muted)]">
            No results found for &ldquo;{title}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setResults([]);
            }}
            className="text-[10px] text-[color:var(--muted)] underline mt-1"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1 max-h-48 overflow-auto">
          <p className="text-[10px] text-[color:var(--muted)] mb-1">
            Pick the right match:
          </p>
          {results.slice(0, 6).map((r) => {
            const poster = tmdbPoster(r.posterPath, "w92");
            return (
              <button
                key={`${r.mediaType}:${r.tmdbId}`}
                type="button"
                disabled={adding}
                onClick={() => onPick(r)}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-[color:var(--surface-elevated)] text-left w-full disabled:opacity-50"
              >
                <div className="w-6 h-9 relative flex-shrink-0 rounded overflow-hidden bg-[color:var(--surface-elevated)]">
                  {poster && (
                    <Image
                      src={poster}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] truncate">{r.name}</p>
                  <p className="text-[9px] text-[color:var(--muted)]">
                    {r.mediaType === "movie" ? "Movie" : "TV"}
                    {r.date && ` · ${r.date.slice(0, 4)}`}
                  </p>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setResults([]);
            }}
            className="text-[10px] text-[color:var(--muted)] underline mt-1"
          >
            Cancel
          </button>
        </div>
      )}
      {adding && (
        <p className="text-[10px] text-[color:var(--muted)] mt-1">Adding…</p>
      )}
      {err && (
        <span className="text-[10px] text-[color:var(--danger)]">{err}</span>
      )}
    </div>
  );
}
