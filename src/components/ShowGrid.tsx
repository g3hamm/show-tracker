"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { ShowRow } from "@/lib/shows/types";
import { ShowCard } from "./ShowCard";

interface ShowGridProps {
  shows: ShowRow[];
  badge?: "new" | "soon";
  emptyMessage?: string;
}

export function ShowGrid({ shows, badge, emptyMessage }: ShowGridProps) {
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
      className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-thin px-[calc(50%-5rem)]"
    >
      {shows.map((s, i) => {
        const distance = Math.abs(i - centerIndex);
        const scale = distance === 0 ? 1.15 : distance === 1 ? 0.95 : 0.8;
        const opacity = distance === 0 ? 1 : distance === 1 ? 0.85 : 0.6;
        return (
          <div
            key={s.id}
            className="flex-shrink-0 w-40 sm:w-48 transition-all duration-300 ease-out"
            style={{
              transform: `scale(${scale})`,
              opacity,
              zIndex: distance === 0 ? 10 : 5 - distance,
            }}
          >
            <ShowCard show={s} badge={badge} />
          </div>
        );
      })}
    </div>
  );
}
