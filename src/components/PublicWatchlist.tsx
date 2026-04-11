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
    const rect = el.getBoundingClientRect();
    const containerCenter = rect.left + rect.width / 2;
    const cards = el.querySelectorAll<HTMLElement>("[data-card]");
    cards.forEach((card) => {
      const cr = card.getBoundingClientRect();
      const cardCenter = cr.left + cr.width / 2;
      const dist = Math.abs(containerCenter - cardCenter);
      const maxDist = rect.width * 0.5;
      const ratio = Math.min(dist / maxDist, 1);
      const scale = 1.05 - ratio * 0.15;
      const opacity = 1 - ratio * 0.35;
      card.style.transform = `scale(${scale})`;
      card.style.opacity = `${opacity}`;
    });
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateStyles);
  }, [updateStyles]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    updateStyles();
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onScroll, updateStyles, shows]);

  if (shows.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="max-w-xl mx-auto px-6 sm:px-8">
        <h2 className="text-lg font-semibold mb-1">Currently watching</h2>
        <p className="text-xs text-[color:var(--muted)] mb-4">
          Here&apos;s what we&apos;re watching right now.
        </p>
      </div>
      <div
        ref={scrollRef}
        className="flex items-start gap-3 overflow-x-auto py-2 scrollbar-thin"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          aria-hidden="true"
          className="flex-shrink-0 w-6 sm:w-8 lg:w-[max(2rem,calc((100vw-36rem)/2+2rem))]"
        />
        {shows.map((show) => {
          const poster = tmdbPoster(show.poster_path, "w342");
          const progress =
            show.current_season != null && show.current_episode != null
              ? `S${show.current_season}E${show.current_episode}`
              : null;
          return (
            <div
              key={show.tmdb_id ?? show.name}
              data-card
              className="flex-shrink-0 w-28 sm:w-32 flex flex-col will-change-transform origin-center"
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
        <div aria-hidden="true" className="flex-shrink-0 w-[50vw]" />
      </div>
    </section>
  );
}
