"use client";

import { useState, useTransition } from "react";
import { updateProgress } from "@/lib/shows/actions";

interface EpisodeProgressFormProps {
  showId: string;
  currentSeason: number | null;
  currentEpisode: number | null;
}

export function EpisodeProgressForm({
  showId,
  currentSeason,
  currentEpisode,
}: EpisodeProgressFormProps) {
  const [season, setSeason] = useState(currentSeason?.toString() ?? "");
  const [episode, setEpisode] = useState(currentEpisode?.toString() ?? "");
  const [pending, startTransition] = useTransition();

  const hasProgress = currentSeason != null && currentEpisode != null;
  const isDirty =
    season !== (currentSeason?.toString() ?? "") ||
    episode !== (currentEpisode?.toString() ?? "");

  function onSave() {
    const s = season.trim() ? parseInt(season, 10) : null;
    const e = episode.trim() ? parseInt(episode, 10) : null;
    if (s != null && (isNaN(s) || s < 0)) return;
    if (e != null && (isNaN(e) || e < 0)) return;
    startTransition(async () => {
      await updateProgress(showId, s, e);
    });
  }

  function onClear() {
    startTransition(async () => {
      await updateProgress(showId, null, null);
      setSeason("");
      setEpisode("");
    });
  }

  return (
    <div className="p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-2">
        We&apos;re on
      </p>
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-[10px] text-[color:var(--muted)] mb-1">
            Season
          </label>
          <input
            type="number"
            min={1}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="—"
            className="w-16 px-2 py-1.5 text-sm rounded-md bg-[color:var(--surface-elevated)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[color:var(--muted)] mb-1">
            Episode
          </label>
          <input
            type="number"
            min={1}
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            placeholder="—"
            className="w-16 px-2 py-1.5 text-sm rounded-md bg-[color:var(--surface-elevated)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={pending || !isDirty}
          className="px-3 py-1.5 text-xs rounded-md bg-[color:var(--accent)] text-black font-medium disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {hasProgress && (
          <button
            type="button"
            onClick={onClear}
            disabled={pending}
            className="px-3 py-1.5 text-xs rounded-md bg-[color:var(--surface-elevated)] border border-[color:var(--border)] hover:border-[color:var(--accent)] disabled:opacity-40"
          >
            Clear
          </button>
        )}
      </div>
      {hasProgress && !isDirty && (
        <p className="text-xs text-[color:var(--muted)] mt-2">
          Currently on S{currentSeason}E{currentEpisode}
        </p>
      )}
    </div>
  );
}
