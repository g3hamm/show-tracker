import Image from "next/image";
import Link from "next/link";
import type { ShowRow } from "@/lib/shows/types";
import { tmdbPoster } from "@/lib/tmdb/client";
import { WatchProviders } from "./WatchProviders";
import { StarRating } from "./StarRating";
import { ArchiveToggle } from "./ArchiveToggle";

export function FinishedSection({ shows }: { shows: ShowRow[] }) {
  if (shows.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)] italic">
        Nothing finished yet. Archive a show when you&apos;re done watching.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {shows.map((show) => {
        const poster = tmdbPoster(show.poster_path, "w185");
        const isMovie = show.media_type === "movie";
        return (
          <div
            key={show.id}
            className="flex gap-4 p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]"
          >
            <Link href={`/show/${show.id}`} className="flex-shrink-0">
              <div className="w-16 h-24 relative rounded overflow-hidden bg-[color:var(--surface-elevated)]">
                {poster ? (
                  <Image
                    src={poster}
                    alt={show.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[color:var(--muted)] p-1 text-center">
                    {show.name}
                  </div>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/show/${show.id}`}>
                  <h4 className="font-medium text-sm hover:text-[color:var(--accent)] transition-colors">{show.name}</h4>
                </Link>
                {isMovie && (
                  <span className="text-[9px] font-semibold uppercase px-1 py-0.5 rounded bg-blue-600/20 text-blue-400">
                    Movie
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[color:var(--muted)] mt-0.5">
                {show.first_air_date && <span>{show.first_air_date.slice(0, 4)}</span>}
                {show.recommended_by && (
                  <span className="text-amber-400">Rec&apos;d by {show.recommended_by}</span>
                )}
              </div>
              {show.recommendation_note && (
                <p className="text-[11px] text-[color:var(--foreground)]/60 italic mt-1 line-clamp-2">
                  &ldquo;{show.recommendation_note}&rdquo;
                </p>
              )}
              <div className="mt-1.5">
                <WatchProviders providers={show.watch_providers} size="sm" />
              </div>
              <div className="mt-2">
                <StarRating showId={show.id} rating={show.rating} review={show.review} />
              </div>
              {show.review && !show.rating && (
                <p className="text-xs text-[color:var(--foreground)]/80 mt-1 italic line-clamp-2">
                  &ldquo;{show.review}&rdquo;
                </p>
              )}
              <div className="mt-2">
                <ArchiveToggle id={show.id} archived={show.archived} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
