"use client";

import Image from "next/image";
import { useRef, useEffect, useCallback } from "react";
import type { PublicShowRow } from "@/lib/shows/public-queries";
import { tmdbPoster } from "@/lib/tmdb/client";

interface PublicWatchlistProps {
  shows: PublicShowRow[];
}

export function PublicWatchlist({ shows }: PublicWatchlistProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updateStyles = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollCenter = el.scrollLeft + el.clientWidth / 2;
    const cards = el.children;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(scrollCenter - cardCenter);
      const maxDist = el.clientWidth / 2;
      const ratio = Math.min(dist / maxDist, 1);
      const scale = 1.08 - ratio * 0.2;
      const opacity = 1 - ratio * 0.4;
      card.style.transform = `scale(${scale})`;
      card.style.opacity = `${opacity}`;
    }
  }, []);

  const onScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateStyles);
  }, [updateStyles]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    updateStyles();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onScroll, updateStyles, shows]);

  if (shows.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-1">Currently watching</h2>
      <p className="text-xs text-[color:var(--muted)] mb-4">
        Here&apos;s what we&apos;re watching right now.
      </p>
      <div
        ref={scrollRef}
        className="flex items-start gap-3 overflow-x-auto py-4 scrollbar-thin"
        style={{ paddingLeft: "calc(50% - 4rem)", paddingRight: "calc(50% - 4rem)", WebkitOverflowScrolling: "touch" }}
      >
        {shows.map((show) => {
          const poster = tmdbPoster(show.poster_path, "w342");
          const progress =
            show.current_season != null && show.current_episode != null
              ? `S${show.current_season}E${show.current_episode}`
              : null;
          return (
            <div
              key={show.tmdb_id ?? show.name}
              className="flex-shrink-0 w-28 sm:w-32 flex flex-col will-change-transform"
              style={{ transformOrigin: "center center" }}
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
