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

  const displayRating = hoverRating || currentRating;

  return (
    <div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              setCurrentRating(star === currentRating ? 0 : star);
              setEditing(true);
            }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-lg transition-colors"
          >
            <span className={displayRating >= star ? "text-amber-400" : "text-[color:var(--muted)]/30"}>
              {displayRating >= star ? "★" : "☆"}
            </span>
          </button>
        ))}
        {currentRating > 0 && !editing && (
          <span className="text-[10px] text-[color:var(--muted)] ml-1">{currentRating}/5</span>
        )}
      </div>
      {(editing || currentReview) && (
        <div className="mt-2">
          <textarea
            value={currentReview}
            onChange={(e) => {
              setCurrentReview(e.target.value);
              setEditing(true);
            }}
            onFocus={() => setEditing(true)}
            placeholder="Our thoughts..."
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 rounded text-xs bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)] resize-none"
          />
          {editing && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="text-[11px] px-3 py-1 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors"
                >
                  {pending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRating(rating ?? 0);
                    setCurrentReview(review ?? "");
                    setEditing(false);
                    setError(null);
                  }}
                  className="text-[11px] px-3 py-1 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
              {error && (
                <p className="text-[10px] text-[color:var(--danger)]">{error}</p>
              )}
            </div>
          )}
        </div>
      )}
      {!editing && !currentReview && currentRating === 0 && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[10px] text-[color:var(--muted)] hover:text-[color:var(--foreground)] mt-1"
        >
          Add rating & notes
        </button>
      )}
    </div>
  );
}
