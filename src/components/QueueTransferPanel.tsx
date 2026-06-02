"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Queue } from "@/lib/families/types";
import { addShowToAdditionalQueues, moveShowToQueue } from "@/lib/shows/actions";

interface QueueTransferPanelProps {
  queueShowId: string;
  currentQueueId: string;
  showName: string;
  queues: Queue[];
}

export function QueueTransferPanel({
  queueShowId,
  currentQueueId,
  showName,
  queues,
}: QueueTransferPanelProps) {
  const router = useRouter();
  const otherQueues = queues.filter((q) => q.id !== currentQueueId);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (otherQueues.length === 0) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCopy() {
    const ids = [...selected];
    startTransition(async () => {
      try {
        await addShowToAdditionalQueues(queueShowId, ids);
        const names = otherQueues.filter((q) => ids.includes(q.id)).map((q) => q.name);
        setDone(`Added to ${names.join(", ")}`);
        setOpen(false);
        setSelected(new Set());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add");
      }
    });
  }

  function handleMove(targetQueueId: string) {
    const targetName = otherQueues.find((q) => q.id === targetQueueId)?.name ?? "queue";
    startTransition(async () => {
      try {
        await moveShowToQueue(queueShowId, targetQueueId);
        router.push(`/q/${targetQueueId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : `Failed to move to ${targetName}`);
      }
    });
  }

  if (done) {
    return (
      <p className="text-xs text-emerald-400 mt-1">{done}</p>
    );
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] underline transition-colors"
        >
          Add to another queue…
        </button>
      ) : (
        <div className="p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
          <p className="text-xs text-[color:var(--muted)] uppercase tracking-wider mb-3">
            Add or move &ldquo;{showName}&rdquo; to:
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {otherQueues.map((q) => (
              <label key={q.id} className="flex items-center justify-between gap-3 cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggle(q.id)}
                    disabled={pending}
                    className="accent-[color:var(--accent)]"
                  />
                  <span className="text-sm font-medium">{q.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${q.type === "solo" ? "bg-[color:var(--surface-elevated)] text-[color:var(--muted)]" : "bg-purple-600/20 text-purple-400"}`}>
                    {q.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleMove(q.id)}
                  disabled={pending}
                  className="text-[11px] text-[color:var(--muted)] hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                >
                  Move here →
                </button>
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-[color:var(--danger)] mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={pending || selected.size === 0}
              className="px-3 py-1.5 rounded text-sm bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
            >
              {pending ? "…" : `Copy to ${selected.size || ""} queue${selected.size !== 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setSelected(new Set()); setError(null); }}
              disabled={pending}
              className="px-3 py-1.5 rounded text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
