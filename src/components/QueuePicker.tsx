"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Queue } from "@/lib/families/types";

function QueueIcon({ isSolo }: { isSolo: boolean }) {
  if (isSolo) {
    return (
      <svg className="w-4 h-4 text-[color:var(--muted)] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-[color:var(--muted)] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
    </svg>
  );
}

export function QueuePicker({
  queues,
  currentQueueId,
}: {
  queues: Queue[];
  currentQueueId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = queues.find((q) => q.id === currentQueueId);
  if (!current) return null;

  const isSolo = current.type === "solo";
  const label = isSolo ? "Solo" : "Group";

  // Single queue — show as a static chip, no dropdown
  if (queues.length <= 1) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color:var(--surface)] border border-[color:var(--border)] text-sm">
        <QueueIcon isSolo={isSolo} />
        <span className="text-[color:var(--muted)]">{label}:</span>
        <span className="font-semibold">{current.name}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color:var(--surface)] border border-[color:var(--border)] text-sm hover:bg-[color:var(--surface-elevated)] transition-colors"
      >
        <QueueIcon isSolo={isSolo} />
        <span className="text-[color:var(--muted)]">{label}:</span>
        <span className="font-semibold">{current.name}</span>
        <svg className="w-3.5 h-3.5 text-[color:var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 left-0 mt-1 min-w-[14rem] bg-[color:var(--background)] border border-[color:var(--border)] rounded-lg shadow-xl overflow-hidden">
          {queues.map((q) => {
            const qSolo = q.type === "solo";
            const isCurrent = q.id === currentQueueId;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/q/${q.id}`);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[color:var(--surface)] transition-colors ${isCurrent ? "bg-[color:var(--surface)]" : ""}`}
              >
                <QueueIcon isSolo={qSolo} />
                <span className="text-[color:var(--muted)] text-xs uppercase tracking-wide">{qSolo ? "Solo" : "Group"}</span>
                <span className="flex-1 truncate font-medium">{q.name}</span>
                {isCurrent && (
                  <svg className="w-4 h-4 text-[#C01900] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
