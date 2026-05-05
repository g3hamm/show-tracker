"use client";

import { useState, useTransition } from "react";
import { createInvite } from "@/lib/families/actions";

export function InviteGenerator({
  familyId,
  siteUrl,
}: {
  familyId: string;
  siteUrl: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function onGenerate() {
    startTransition(async () => {
      const newCode = await createInvite(familyId);
      setCode(newCode);
      setCopied(false);
    });
  }

  function onCopy() {
    if (!code) return;
    const url = `${siteUrl}/family/join/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {code ? (
        <div className="flex items-center gap-2">
          <code className="text-sm bg-[color:var(--surface-elevated)] px-3 py-2 rounded border border-[color:var(--border)] flex-1 truncate">
            {siteUrl}/family/join/{code}
          </code>
          <button
            type="button"
            onClick={onCopy}
            className="px-3 py-2 text-sm rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onGenerate}
          disabled={pending}
          className="px-4 py-2 text-sm rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
        >
          {pending ? "Generating…" : "Generate invite link"}
        </button>
      )}
    </div>
  );
}
