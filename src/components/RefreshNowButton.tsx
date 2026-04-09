"use client";

import { useState, useTransition } from "react";
import { refreshAll } from "@/lib/shows/actions";

export function RefreshNowButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      try {
        const r = await refreshAll();
        setResult(
          r.failed > 0
            ? `Refreshed ${r.refreshed}, ${r.failed} failed`
            : `Refreshed ${r.refreshed} shows`,
        );
      } catch (err) {
        setResult(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="px-3 py-1.5 rounded text-sm bg-[color:var(--surface-elevated)] hover:bg-[color:var(--border)] transition-colors disabled:opacity-60"
      >
        {pending ? "Refreshing…" : "Refresh now"}
      </button>
      {result && (
        <span className="text-xs text-[color:var(--muted)]">{result}</span>
      )}
    </div>
  );
}
