import type { CrossQueueEntry } from "@/lib/shows/queries";

export function CrossQueueProgress({ entries }: { entries: CrossQueueEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-2">
        Also tracking
      </p>
      <div className="flex flex-col gap-1.5">
        {entries.map((e, i) => {
          const label =
            e.queue_type === "solo" && e.owner_display_name
              ? e.owner_display_name
              : e.queue_name;
          const progress =
            e.current_season != null && e.current_episode != null
              ? `S${e.current_season}E${e.current_episode}`
              : null;

          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-medium">{label}</span>
              {e.archived ? (
                <span className="text-emerald-400">Finished</span>
              ) : progress ? (
                <span className="text-[color:var(--muted)]">is on {progress}</span>
              ) : (
                <span className="text-[color:var(--muted)]">is watching</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
