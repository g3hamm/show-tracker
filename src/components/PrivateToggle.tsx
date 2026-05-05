"use client";

import { useTransition } from "react";
import { togglePrivate } from "@/lib/shows/actions";

export function PrivateToggle({
  queueShowId,
  isPrivate,
}: {
  queueShowId: string;
  isPrivate: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await togglePrivate(queueShowId);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-[11px] px-2 py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--border)] border border-[color:var(--border)] transition-colors"
      title={isPrivate ? "This show is hidden from family members" : "Click to hide this show from family"}
    >
      {pending ? "…" : isPrivate ? "Private" : "Make private"}
    </button>
  );
}
