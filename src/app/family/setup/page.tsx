"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFamily } from "@/lib/families/actions";
import { Logo } from "@/components/Logo";

export default function FamilySetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createFamily(name.trim());
        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create family");
      }
    });
  }

  return (
    <main className="min-h-screen">
      <div className="bg-[#C01900] shadow-lg">
        <div className="max-w-xl mx-auto px-6 sm:px-8 py-4">
          <Logo />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 sm:px-8 mt-12">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Chillflix</h1>
        <p className="text-sm text-[color:var(--muted)] mt-2 mb-8">
          Create a family to get started. You can invite others to join later.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="family-name" className="block text-sm font-medium mb-1">
              Family name
            </label>
            <input
              id="family-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Hamm Family"
              autoFocus
              maxLength={60}
              className="w-full px-4 py-3 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)]"
            />
          </div>

          {error && (
            <p className="text-sm text-[color:var(--danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="px-6 py-3 rounded-md bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
          >
            {pending ? "Creating…" : "Create family"}
          </button>
        </form>
      </div>
    </main>
  );
}
