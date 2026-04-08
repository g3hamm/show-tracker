import Image from "next/image";
import type { RecommendationRow } from "@/lib/recommendations/queries";
import { tmdbPoster } from "@/lib/tmdb/client";
import { AddRecommendationButton } from "./AddRecommendationButton";
import { DismissRecommendationButton } from "./DismissRecommendationButton";

export function RecommendationCard({ rec }: { rec: RecommendationRow }) {
  const poster = tmdbPoster(rec.poster_path, "w185");

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <div className="w-16 h-24 relative flex-shrink-0 rounded overflow-hidden bg-[color:var(--surface-elevated)]">
        {poster ? (
          <Image
            src={poster}
            alt={rec.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[color:var(--muted)] p-1 text-center">
            {rec.title}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <h4 className="font-medium text-sm truncate">{rec.title}</h4>
        <p className="text-[11px] text-[color:var(--muted)] mb-1">
          from {rec.recommender_name}
        </p>
        {rec.note && (
          <p className="text-xs text-[color:var(--foreground)]/80 line-clamp-3 mb-2">
            &ldquo;{rec.note}&rdquo;
          </p>
        )}
        <div className="flex gap-2 mt-auto">
          {rec.tmdb_id != null && (
            <AddRecommendationButton
              tmdbId={rec.tmdb_id}
              recommendationId={rec.id}
            />
          )}
          <DismissRecommendationButton id={rec.id} />
        </div>
      </div>
    </div>
  );
}
