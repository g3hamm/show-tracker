"use client";

import { useState, useTransition } from "react";
import { addShow } from "@/lib/shows/actions";
import { dismissRecommendation } from "@/lib/recommendations/actions";

export function AddRecommendationButton({
  queueId,
  tmdbId,
  mediaType,
  recommenderName,
  recommenderEmail,
  recommendationNote,
  recommendationId,
}: {
  queueId: string;
  tmdbId: number;
  mediaType: "show" | "movie";
  recommenderName: string;
  recommenderEmail: string | null;
  recommendationNote: string | null;
  recommendationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    startTransition(async () => {
      try {
        await addShow(queueId, tmdbId, mediaType, recommenderName, recommenderEmail, recommendationNote);
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
