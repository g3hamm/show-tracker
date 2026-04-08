"use client";

import { useTransition } from "react";
import { archiveShow } from "@/lib/shows/actions";

export function ArchiveToggle({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await archiveShow(id, !archived);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex-1 text-[11px] py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--accent)]/20 border border-[color:var(--border)] hover:border-[color:var(--accent)]/50 transition-colors"
    >
      {pending ? "…" : archived ? "Unarchive" : "Finish"}
    </button>
  );
}
