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
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {shows.map((s) => (
        <div key={s.id} className="flex-shrink-0 w-36 sm:w-44">
          <ShowCard show={s} badge={badge} />
        </div>
      ))}
    </div>
  );
}
