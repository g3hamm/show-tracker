"use client";

import { useState, useTransition } from "react";
import { rateShow } from "@/lib/shows/actions";

export function StarRating({
  showId,
  rating,
  review,
}: {
  showId: string;
  rating: number | null;
  review: string | null;
}) {
  const [currentRating, setCurrentRating] = useState(rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentReview, setCurrentReview] = useState(review ?? "");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasSaved = currentRating > 0 || currentReview.trim().length > 0;

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await rateShow(
          showId,
          currentRating > 0 ? currentRating : null,
          currentReview.trim().length > 0 ? currentReview.trim() : null,
        );
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  function cancel() {
    setCurrentRating(rating ?? 0);
    setCurrentReview(review ?? "");
    setEditing(false);
    setError(null);
  }

  // Not yet rated — prompt to add
  if (!hasSaved && !editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[10px] text-[color:var(--muted)] hover:text-[color:var(--foreground)] mt-1"
      >
        Add rating &amp; notes
      </button>
    );
  }

  // Rated/reviewed and not editing — compact read view
  if (hasSaved && !editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap mt-1.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-sm leading-none ${currentRating >= star ? "text-amber-400" : "text-[color:var(--muted)]/30"}`}
            >
              {currentRating >= star ? "★" : "☆"}
            </span>
          ))}
          {currentRating > 0 && (
            <span className="text-[10px] text-[color:var(--muted)] ml-1">
              {currentRating}/5
            </span>
          )}
        </div>
        {currentReview.trim() && (
          <span className="text-[11px] text-[color:var(--foreground)]/70 italic truncate max-w-xs">
            &ldquo;{currentReview.trim()}&rdquo;
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[10px] text-[color:var(--muted)] hover:text-[color:var(--foreground)] underline transition-colors"
        >
          Edit
        </button>
      </div>
    );
  }

  // Edit / first-entry form
  const displayRating = hoverRating || currentRating;

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setCurrentRating(star === currentRating ? 0 : star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-lg transition-colors"
          >
            <span
              className={
                displayRating >= star
                  ? "text-amber-400"
                  : "text-[color:var(--muted)]/30"
              }
            >
              {displayRating >= star ? "★" : "☆"}
            </span>
          </button>
        ))}
        {currentRating > 0 && (
          <span className="text-[10px] text-[color:var(--muted)] ml-1">
            {currentRating}/5
          </span>
        )}
      </div>

      <div className="mt-2">
        <textarea
          value={currentReview}
          onChange={(e) => setCurrentReview(e.target.value)}
          placeholder="Our thoughts..."
          maxLength={500}
          rows={2}
          className="w-full px-3 py-2 rounded text-xs bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)] resize-none"
        />
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="text-[11px] px-3 py-1 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {hasSaved && (
            <button
              type="button"
              onClick={cancel}
              className="text-[11px] px-3 py-1 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            >
              Cancel
            </button>
          )}
        </div>
        {error && (
          <p className="text-[10px] text-[color:var(--danger)] mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}
