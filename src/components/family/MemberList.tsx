"use client";

import { useTransition } from "react";
import { removeFamilyMember } from "@/lib/families/actions";
import type { FamilyMember } from "@/lib/families/types";

export function MemberList({
  familyId,
  members,
  currentUserId,
  isAdmin,
}: {
  familyId: string;
  members: FamilyMember[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => (
        <MemberRow
          key={m.user_id}
          familyId={familyId}
          member={m}
          isCurrentUser={m.user_id === currentUserId}
          canRemove={isAdmin && m.user_id !== currentUserId}
        />
      ))}
    </div>
  );
}

function MemberRow({
  familyId,
  member,
  isCurrentUser,
  canRemove,
}: {
  familyId: string;
  member: FamilyMember;
  isCurrentUser: boolean;
  canRemove: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onRemove() {
    if (!confirm(`Remove ${member.display_name ?? "this member"} from the family?`)) return;
    startTransition(async () => {
      await removeFamilyMember(familyId, member.user_id);
    });
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[color:var(--accent)]/20 flex items-center justify-center text-sm font-semibold text-[color:var(--accent)]">
          {(member.display_name ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">
            {member.display_name ?? member.user_id}
            {isCurrentUser && <span className="text-[color:var(--muted)] ml-1">(you)</span>}
          </p>
          <p className="text-[10px] text-[color:var(--muted)] capitalize">{member.role}</p>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          className="text-[11px] px-2 py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--danger)]/20 border border-[color:var(--border)] hover:border-[color:var(--danger)]/50 transition-colors"
        >
          {pending ? "…" : "Remove"}
        </button>
      )}
    </div>
  );
}
