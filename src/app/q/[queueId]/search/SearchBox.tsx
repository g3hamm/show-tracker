"use client";

import Image from "next/image";
import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { searchShows, addShow, addShowToQueues, type SearchResult } from "@/lib/shows/actions";
import type { FamilyTrackingInfo } from "@/lib/shows/queries";
import type { Queue } from "@/lib/families/types";
import { tmdbPoster } from "@/lib/tmdb/client";

interface SearchBoxProps {
  queueId: string;
  trackingStatus: FamilyTrackingInfo[];
  queues: Queue[];
}

export function SearchBox({ queueId, trackingStatus, queues }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const [adding, startAdd] = useTransition();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  // key of the result currently showing the queue picker
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const multiQueue = queues.length > 1;

  const trackingMap = useMemo(() => {
    const map = new Map<string, { queues: string[]; archived: boolean }>();
    for (const t of trackingStatus) {
      const key = `${t.media_type === "movie" ? "movie" : "show"}:${t.tmdb_id}`;
      const entry = map.get(key);
      if (entry) {
        entry.queues.push(t.queue_name);
        if (!t.archived) entry.archived = false;
      } else {
        map.set(key, { queues: [t.queue_name], archived: t.archived });
      }
    }
    return map;
  }, [trackingStatus]);

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

  function openPicker(key: string) {
    setPickerKey(key);
    setPickerSelected(new Set([queueId]));
  }

  function closePicker() {
    setPickerKey(null);
    setPickerSelected(new Set());
  }

  function toggleQueue(id: string) {
    setPickerSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onAdd(r: SearchResult) {
    const key = `${r.mediaType}:${r.tmdbId}`;
    if (multiQueue) {
      openPicker(key);
    } else {
      startAdd(async () => {
        try {
          await addShow(queueId, r.tmdbId, r.mediaType);
          setAddedIds((prev) => new Set(prev).add(key));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Add failed");
        }
      });
    }
  }

  function onConfirmAdd(r: SearchResult) {
    const key = `${r.mediaType}:${r.tmdbId}`;
    const selectedIds = [...pickerSelected];
    closePicker();
    startAdd(async () => {
      try {
        await addShowToQueues(selectedIds, r.tmdbId, r.mediaType);
        setAddedIds((prev) => new Set(prev).add(key));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Add failed");
      }
    });
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search for a show or movie..."
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
          const key = `${r.mediaType}:${r.tmdbId}`;
          const isAdded = addedIds.has(key);
          const tracking = trackingMap.get(key);
          const isPickerOpen = pickerKey === key;

          return (
            <li
              key={key}
              className="flex flex-col rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] overflow-hidden"
            >
              <div className="flex gap-3 p-3">
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{r.name}</h3>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.mediaType === "movie" ? "bg-blue-600/20 text-blue-400" : "bg-emerald-600/20 text-emerald-400"}`}>
                      {r.mediaType === "movie" ? "Movie" : "TV"}
                    </span>
                    {r.date && (
                      <span className="text-xs text-[color:var(--muted)]">
                        {r.date.slice(0, 4)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--muted)] line-clamp-2 mt-1">
                    {r.overview || "No description."}
                  </p>
                  {r.subscribedProviders.length > 0 && (
                    <p className="text-[10px] mt-1.5 text-emerald-400 font-medium">
                      ✓ On {r.subscribedProviders.slice(0, 2).join(", ")}
                      {r.subscribedProviders.length > 2 ? ` +${r.subscribedProviders.length - 2} more` : ""}
                    </p>
                  )}
                  {tracking && (
                    <p className="text-[10px] mt-1">
                      {tracking.archived ? (
                        <span className="text-emerald-400">
                          Finished in {tracking.queues.join(", ")}
                        </span>
                      ) : (
                        <span className="text-amber-400">
                          Watching in {tracking.queues.join(", ")}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => isPickerOpen ? closePicker() : onAdd(r)}
                  disabled={adding || isAdded}
                  className="self-start px-3 py-1.5 rounded text-sm bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-60 transition-colors"
                >
                  {isAdded ? "Added" : adding ? "…" : "Add"}
                </button>
              </div>

              {isPickerOpen && (
                <div className="border-t border-[color:var(--border)] px-3 py-3 bg-[color:var(--surface-elevated)]">
                  <p className="text-xs text-[color:var(--muted)] mb-2">Add to queues:</p>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {queues.map((q) => (
                      <label key={q.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pickerSelected.has(q.id)}
                          onChange={() => toggleQueue(q.id)}
                          className="accent-[color:var(--accent)]"
                        />
                        <span className="text-sm">
                          {q.name}
                          {q.id === queueId && (
                            <span className="text-[10px] text-[color:var(--muted)] ml-1">(current)</span>
                          )}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${q.type === "solo" ? "bg-[color:var(--surface)] text-[color:var(--muted)]" : "bg-purple-600/20 text-purple-400"}`}>
                          {q.type}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onConfirmAdd(r)}
                      disabled={adding || pickerSelected.size === 0}
                      className="px-3 py-1.5 rounded text-sm bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-60 transition-colors"
                    >
                      Add to {pickerSelected.size} queue{pickerSelected.size !== 1 ? "s" : ""}
                    </button>
                    <button
                      type="button"
                      onClick={closePicker}
                      className="px-3 py-1.5 rounded text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
