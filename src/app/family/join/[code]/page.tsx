"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { acceptInvite } from "@/lib/families/actions";
import { Logo } from "@/components/Logo";

export default function JoinFamilyPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!params.code) return;
    startTransition(async () => {
      try {
        await acceptInvite(params.code);
        setJoined(true);
        setTimeout(() => router.push("/"), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join family");
      }
    });
  }, [params.code, router]);

  return (
    <div className="max-w-xl mx-auto px-6 sm:px-8 mt-12 text-center">
      <div className="mb-8">
        <Logo size="lg" />
      </div>

      {pending && (
        <p className="text-sm text-[color:var(--muted)]">Joining family…</p>
      )}

      {joined && (
        <div>
          <p className="text-lg font-semibold text-emerald-400">Welcome to the family!</p>
          <p className="text-sm text-[color:var(--muted)] mt-1">Redirecting to your dashboard…</p>
        </div>
      )}

      {error && (
        <div>
          <p className="text-sm text-[color:var(--danger)] mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
