"use client";

import { useState, useTransition } from "react";
import { createGroupQueue, updateGroupQueue, deleteGroupQueue } from "@/lib/families/actions";
import type { Queue, FamilyMember, QueueMember } from "@/lib/families/types";

interface GroupQueueManagerProps {
  familyId: string;
  groupQueues: Queue[];
  members: FamilyMember[];
  queueMembers: Record<string, QueueMember[]>;
}

export function GroupQueueManager({
  familyId,
  groupQueues,
  members,
  queueMembers,
}: GroupQueueManagerProps) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {groupQueues.map((q) => (
        <GroupQueueCard
          key={q.id}
          queue={q}
          members={members}
          currentMembers={queueMembers[q.id] ?? []}
        />
      ))}

      {creating ? (
        <CreateGroupForm
          familyId={familyId}
          members={members}
          onClose={() => setCreating(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-4 py-2 text-sm rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors self-start"
        >
          + New group
        </button>
      )}
    </div>
  );
}

function GroupQueueCard({
  queue,
  members,
  currentMembers,
}: {
  queue: Queue;
  members: FamilyMember[];
  currentMembers: QueueMember[];
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(queue.name);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(currentMembers.map((m) => m.user_id)),
  );

  function onSave() {
    startTransition(async () => {
      await updateGroupQueue(queue.id, name, Array.from(selectedIds));
      setEditing(false);
    });
  }

  function onDelete() {
    if (!confirm(`Delete the "${queue.name}" group? Shows tracked in this group will be removed.`)) return;
    startTransition(async () => {
      await deleteGroupQueue(queue.id);
    });
  }

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  if (editing) {
    return (
      <div className="p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md bg-[color:var(--surface-elevated)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)] mb-3"
        />
        <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-2">Members</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {members.map((m) => (
            <label key={m.user_id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.has(m.user_id)}
                onChange={() => toggleMember(m.user_id)}
                className="accent-[color:var(--accent)]"
              />
              {m.display_name ?? m.user_id}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={pending || !name.trim() || selectedIds.size === 0}
            className="text-[11px] px-3 py-1.5 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setName(queue.name); setSelectedIds(new Set(currentMembers.map((m) => m.user_id))); }}
            className="text-[11px] px-3 py-1.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <div>
        <p className="text-sm font-medium">{queue.name}</p>
        <p className="text-[10px] text-[color:var(--muted)]">
          {currentMembers.map((m) => m.display_name ?? "Unknown").join(", ") || "No members"}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] px-2 py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--border)] border border-[color:var(--border)] transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="text-[11px] px-2 py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--danger)]/20 border border-[color:var(--border)] hover:border-[color:var(--danger)]/50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function CreateGroupForm({
  familyId,
  members,
  onClose,
}: {
  familyId: string;
  members: FamilyMember[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id)),
  );
  const [pending, startTransition] = useTransition();

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || selectedIds.size === 0) return;
    startTransition(async () => {
      await createGroupQueue(familyId, name, Array.from(selectedIds));
      onClose();
    });
  }

  return (
    <form onSubmit={onSubmit} className="p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <p className="text-sm font-medium mb-3">New group</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name (e.g. Parents Only)"
        autoFocus
        className="w-full px-3 py-2 text-sm rounded-md bg-[color:var(--surface-elevated)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)] mb-3"
      />
      <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-2">Members</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {members.map((m) => (
          <label key={m.user_id} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.has(m.user_id)}
              onChange={() => toggleMember(m.user_id)}
              className="accent-[color:var(--accent)]"
            />
            {m.display_name ?? m.user_id}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !name.trim() || selectedIds.size === 0}
          className="text-[11px] px-3 py-1.5 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] px-3 py-1.5 text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
