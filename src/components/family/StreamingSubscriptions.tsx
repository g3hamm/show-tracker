"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateFamilySubscriptions } from "@/lib/families/actions";
import { tmdbLogo } from "@/lib/tmdb/client";
import type { FamilySubscription } from "@/lib/families/types";

interface ProviderInfo {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export function StreamingSubscriptions({
  familyId,
  current,
  showProviders,
  tmdbProviders,
}: {
  familyId: string;
  current: FamilySubscription[];
  showProviders: ProviderInfo[];
  tmdbProviders: ProviderInfo[];
}) {
  const allProviders = mergeProviders(showProviders, tmdbProviders);
  const [selected, setSelected] = useState<Set<number>>(
    new Set(current.map((s) => s.provider_id)),
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const isDirty = !setsEqual(selected, new Set(current.map((s) => s.provider_id)));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  function onSave() {
    const providers = allProviders
      .filter((p) => selected.has(p.provider_id))
      .map((p) => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path,
      }));
    startTransition(async () => {
      await updateFamilySubscriptions(familyId, providers);
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allProviders.map((p) => {
          const logo = tmdbLogo(p.logo_path, "w45");
          const isSelected = selected.has(p.provider_id);
          return (
            <button
              key={p.provider_id}
              type="button"
              onClick={() => toggle(p.provider_id)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                isSelected
                  ? "bg-[color:var(--accent)]/10 border-[color:var(--accent)]/50"
                  : "bg-[color:var(--surface)] border-[color:var(--border)] opacity-60 hover:opacity-80"
              }`}
            >
              {logo && (
                <Image
                  src={logo}
                  alt={p.provider_name}
                  width={24}
                  height={24}
                  className="rounded-[4px] flex-shrink-0"
                />
              )}
              <span className="text-xs font-medium truncate">{p.provider_name}</span>
            </button>
          );
        })}
      </div>
      {isDirty && (
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="mt-4 px-4 py-2 text-sm rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving…" : "Save subscriptions"}
        </button>
      )}
      {saved && !isDirty && (
        <p className="text-xs text-emerald-400 mt-2">Saved!</p>
      )}
    </div>
  );
}

function mergeProviders(
  fromShows: ProviderInfo[],
  fromTmdb: ProviderInfo[],
): ProviderInfo[] {
  const map = new Map<number, ProviderInfo>();
  // Top 30 from TMDB (sorted by display_priority, most popular first)
  for (const p of fromTmdb.slice(0, 30)) map.set(p.provider_id, p);
  // Show providers always included (these are services with content you track)
  for (const p of fromShows) {
    if (!map.has(p.provider_id)) map.set(p.provider_id, p);
  }
  return Array.from(map.values()).sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

function setsEqual(a: Set<number>, b: Set<number>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
