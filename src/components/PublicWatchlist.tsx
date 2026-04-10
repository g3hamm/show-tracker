"use client";

import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import type { PublicShowRow } from "@/lib/shows/public-queries";
import { tmdbPoster } from "@/lib/tmdb/client";

interface PublicWatchlistProps {
  shows: PublicShowRow[];
}

export function PublicWatchlist({ shows }: PublicWatchlistProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState(0);

  const updateCenter = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollCenter = el.scrollLeft + el.clientWidth / 2;
    const cards = el.children;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(scrollCenter - cardCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setCenterIndex(closest);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateCenter, { passive: true });
    updateCenter();
    return () => el.removeEventListener("scroll", updateCenter);
  }, [updateCenter, shows]);

  if (shows.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-1">Currently watching</h2>
      <p className="text-xs text-[color:var(--muted)] mb-4">
        Here&apos;s what we&apos;re watching right now.
      </p>
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin px-[calc(50%-4rem)]"
      >
        {shows.map((show, i) => {
          const poster = tmdbPoster(show.poster_path, "w342");
          const progress =
            show.current_season != null && show.current_episode != null
              ? `S${show.current_season}E${show.current_episode}`
              : null;
          const distance = Math.abs(i - centerIndex);
          const scale = distance === 0 ? 1.15 : distance === 1 ? 0.95 : 0.8;
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.85 : 0.6;
          return (
            <div
              key={show.tmdb_id ?? show.name}
              className="flex-shrink-0 w-28 sm:w-32 flex flex-col transition-all duration-300 ease-out"
              style={{
                transform: `scale(${scale})`,
                opacity,
                zIndex: distance === 0 ? 10 : 5 - distance,
              }}
            >
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-[color:var(--surface-elevated)]">
                {poster ? (
                  <Image
                    src={poster}
                    alt={show.name}
                    fill
                    sizes="(max-width: 640px) 112px, 128px"
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
              <p className="text-xs font-medium mt-1.5 truncate text-center">{show.name}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
