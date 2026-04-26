import Image from "next/image";
import type { RecommendationRow } from "@/lib/recommendations/queries";
import { tmdbPoster } from "@/lib/tmdb/client";
import { AddRecommendationButton } from "./AddRecommendationButton";
import { DismissRecommendationButton } from "./DismissRecommendationButton";

export function RecommendationCard({ rec }: { rec: RecommendationRow }) {
  const poster = tmdbPoster(rec.poster_path, "w185");
  const mediaType = (rec.media_type === "movie" ? "movie" : "show") as "show" | "movie";

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <div className="flex gap-3">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{rec.title}</h4>
            <span className={`flex-shrink-0 text-[9px] font-semibold uppercase px-1 py-0.5 rounded ${mediaType === "movie" ? "bg-blue-600/20 text-blue-400" : "bg-emerald-600/20 text-emerald-400"}`}>
              {mediaType === "movie" ? "Movie" : "TV"}
            </span>
          </div>
          <p className="text-[11px] text-[color:var(--muted)]">
            from {rec.recommender_name}
          </p>
          {rec.note && (
            <p className="text-xs text-[color:var(--foreground)]/80 line-clamp-2 mt-1">
              &ldquo;{rec.note}&rdquo;
            </p>
          )}
        </div>
      </div>

      {rec.overview && (
        <p className="text-xs text-[color:var(--muted)] leading-relaxed line-clamp-3">
          {rec.overview}
        </p>
      )}

      <div className="flex gap-2">
        {rec.tmdb_id != null && (
          <AddRecommendationButton
            tmdbId={rec.tmdb_id}
            mediaType={mediaType}
            recommenderName={rec.recommender_name}
            recommenderEmail={rec.recommender_email}
            recommendationNote={rec.note}
            recommendationId={rec.id}
          />
        )}
        <DismissRecommendationButton id={rec.id} />
      </div>
    </div>
  );
}
