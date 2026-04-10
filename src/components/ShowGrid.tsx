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
    const scrollCenter = el.scrollLeft + el.clientWidth / 2;
    const cards = el.children;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(scrollCenter - cardCenter);
      const maxDist = el.clientWidth * 0.6;
      const ratio = Math.min(dist / maxDist, 1);
      const scale = 1.05 - ratio * 0.15;
      const opacity = 1 - ratio * 0.35;
      card.style.transform = `scale(${scale})`;
      card.style.opacity = `${opacity}`;
    }
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
      <p className="text-sm text-[color:var(--muted)] italic">
        {emptyMessage ?? "Nothing here yet."}
      </p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex items-start gap-4 overflow-x-auto py-2 scrollbar-thin"
      style={{ WebkitOverflowScrolling: "touch", paddingLeft: "25%", paddingRight: "25%" }}
    >
      {shows.map((s) => (
        <div
          key={s.id}
          className="flex-shrink-0 w-36 sm:w-44 will-change-transform origin-center"
        >
          <ShowCard show={s} badge={badge} />
        </div>
      ))}
    </div>
  );
}
