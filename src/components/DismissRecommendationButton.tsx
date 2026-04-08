"use client";

import { useTransition } from "react";
import { dismissRecommendation } from "@/lib/recommendations/actions";

export function DismissRecommendationButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Dismiss this recommendation?")) return;
    startTransition(async () => {
      await dismissRecommendation(id);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-[11px] px-2 py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--danger)]/20 border border-[color:var(--border)] hover:border-[color:var(--danger)]/50 transition-colors"
    >
      {pending ? "…" : "Dismiss"}
    </button>
  );
}
