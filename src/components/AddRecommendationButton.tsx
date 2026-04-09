"use client";

import { useState, useTransition } from "react";
import { addShow } from "@/lib/shows/actions";
import { dismissRecommendation } from "@/lib/recommendations/actions";

export function AddRecommendationButton({
  tmdbId,
  recommendationId,
}: {
  tmdbId: number;
  recommendationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    startTransition(async () => {
      try {
        await addShow(tmdbId);
        // Clean up the inbox entry now that it's tracked.
        await dismissRecommendation(recommendationId);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-[11px] px-2 py-1 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors"
      >
        {pending ? "Adding…" : "Add to tracker"}
      </button>
      {err && <span className="text-[10px] text-[color:var(--danger)]">{err}</span>}
    </>
  );
}
