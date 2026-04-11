"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ShowRow } from "@/lib/shows/types";
import { ShowCard } from "./ShowCard";

interface ShowGridProps {
  shows: ShowRow[];
  badge?: "new" | "soon";
  emptyMessage?: string;
}

export function ShowGrid({ shows, badge, emptyMessage }: ShowGridProps) {
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

  if (shows.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <p className="text-sm text-[color:var(--muted)] italic">
          {emptyMessage ?? "Nothing here yet."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex items-start gap-4 overflow-x-auto py-2 scrollbar-thin"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div
        aria-hidden="true"
        className="flex-shrink-0 w-6 sm:w-8 lg:w-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      />
      {shows.map((s) => (
        <div
          key={s.id}
          data-card
          className="flex-shrink-0 w-36 sm:w-44 will-change-transform origin-center"
        >
          <ShowCard show={s} badge={badge} />
        </div>
      ))}
      <div aria-hidden="true" className="flex-shrink-0 w-[50vw]" />
    </div>
  );
}
