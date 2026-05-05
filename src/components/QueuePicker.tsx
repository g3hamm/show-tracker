"use client";

import { useRouter } from "next/navigation";
import type { Queue } from "@/lib/families/types";

export function QueuePicker({
  queues,
  currentQueueId,
}: {
  queues: Queue[];
  currentQueueId: string;
}) {
  const router = useRouter();

  if (queues.length <= 1) {
    const q = queues[0];
    if (!q) return null;
    return (
      <span className="text-sm font-semibold text-white/80">
        {q.name}
      </span>
    );
  }

  return (
    <div className="relative">
      <select
        value={currentQueueId}
        onChange={(e) => router.push(`/q/${e.target.value}`)}
        className="bg-white/20 text-white text-sm font-semibold rounded px-3 py-1.5 pr-7 border-none outline-none cursor-pointer appearance-none hover:bg-white/30 transition-colors"
      >
        {queues.map((q) => (
          <option key={q.id} value={q.id} className="bg-[#1a1a1a] text-white">
            {q.type === "solo" ? `${q.name}` : q.name}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/70 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
