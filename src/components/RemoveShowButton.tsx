"use client";

import { useTransition } from "react";
import { removeShow } from "@/lib/shows/actions";

export function RemoveShowButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Remove this show?")) return;
    startTransition(async () => {
      await removeShow(id);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex-1 text-[11px] py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--danger)]/20 border border-[color:var(--border)] hover:border-[color:var(--danger)]/50 transition-colors"
    >
      {pending ? "…" : "Remove"}
    </button>
  );
}
