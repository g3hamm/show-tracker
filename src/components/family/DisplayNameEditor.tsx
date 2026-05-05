"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "@/lib/families/actions";

export function DisplayNameEditor({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateDisplayName(name.trim());
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{currentName}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] text-[color:var(--muted)] hover:text-[color:var(--foreground)] underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        maxLength={60}
        className="px-3 py-1.5 text-sm rounded-md bg-[color:var(--surface-elevated)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)]"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={pending || !name.trim()}
        className="text-[11px] px-3 py-1.5 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
      >
        {pending ? "…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => { setName(currentName); setEditing(false); }}
        className="text-[11px] px-2 py-1.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
      >
        Cancel
      </button>
    </div>
  );
}
