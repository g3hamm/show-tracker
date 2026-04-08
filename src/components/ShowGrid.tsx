import type { ShowRow } from "@/lib/shows/types";
import { ShowCard } from "./ShowCard";

interface ShowGridProps {
  shows: ShowRow[];
  badge?: "new" | "soon";
  emptyMessage?: string;
}

export function ShowGrid({ shows, badge, emptyMessage }: ShowGridProps) {
  if (shows.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)] italic">
        {emptyMessage ?? "Nothing here yet."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {shows.map((s) => (
        <ShowCard key={s.id} show={s} badge={badge} />
      ))}
    </div>
  );
}
