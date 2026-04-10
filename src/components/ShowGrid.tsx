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
      className="flex items-start gap-4 overflow-x-auto py-4 scrollbar-thin"
      style={{ paddingLeft: "calc(50% - 5rem)", paddingRight: "calc(50% - 5rem)", WebkitOverflowScrolling: "touch" }}
    >
      {shows.map((s) => (
        <div
          key={s.id}
          className="flex-shrink-0 w-40 sm:w-48 will-change-transform"
          style={{ transformOrigin: "center center" }}
        >
          <ShowCard show={s} badge={badge} />
        </div>
      ))}
    </div>
  );
}
