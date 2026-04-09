import Image from "next/image";
import type { PublicShowRow } from "@/lib/shows/public-queries";
import { tmdbPoster } from "@/lib/tmdb/client";

interface PublicWatchlistProps {
  shows: PublicShowRow[];
}

export function PublicWatchlist({ shows }: PublicWatchlistProps) {
  if (shows.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-1">Currently watching</h2>
      <p className="text-xs text-[color:var(--muted)] mb-4">
        Here&apos;s what we&apos;re watching right now.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {shows.map((show) => {
          const poster = tmdbPoster(show.poster_path, "w342");
          const progress =
            show.current_season != null && show.current_episode != null
              ? `S${show.current_season}E${show.current_episode}`
              : null;
          return (
            <div key={show.tmdb_id ?? show.name} className="flex flex-col">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-[color:var(--surface-elevated)]">
                {poster ? (
                  <Image
                    src={poster}
                    alt={show.name}
                    fill
                    sizes="(max-width: 640px) 33vw, 120px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[color:var(--muted)] text-[10px] p-1 text-center">
                    {show.name}
                  </div>
                )}
                {progress && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-center text-[10px] font-semibold text-white py-1">
                    {progress}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium mt-1.5 truncate">{show.name}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
