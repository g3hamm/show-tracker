"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateFamilySubscriptions } from "@/lib/families/actions";
import { tmdbLogo } from "@/lib/tmdb/client";
import type { FamilySubscription } from "@/lib/families/types";

const COMMON_PROVIDERS = [
  { provider_id: 8, provider_name: "Netflix", logo_path: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
  { provider_id: 9, provider_name: "Amazon Prime Video", logo_path: "/pvAjkfyLLPLEGiFC91wcKAAkID7.jpg" },
  { provider_id: 337, provider_name: "Disney Plus", logo_path: "/97yvRBw1GzX7fXprcF80er19ot.jpg" },
  { provider_id: 15, provider_name: "Hulu", logo_path: "/gJ3yVMWouaVj6iHd59TISJ1TlM5.jpg" },
  { provider_id: 1899, provider_name: "Max", logo_path: "/6Q3KKEFIL3sOiRMjTbOBEwmKGsT.jpg" },
  { provider_id: 350, provider_name: "Apple TV Plus", logo_path: "/6uhKBfmtzFqOcLousHwZuzcrScK.jpg" },
  { provider_id: 386, provider_name: "Peacock", logo_path: "/xTHltMrZPAJFLQ6qyCBjAnXSmZt.jpg" },
  { provider_id: 531, provider_name: "Paramount Plus", logo_path: "/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg" },
  { provider_id: 636, provider_name: "MGM Plus", logo_path: "/2PTFxgrswnkhUDAPBjSgNbTOVnE.jpg" },
  { provider_id: 283, provider_name: "Crunchyroll", logo_path: "/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg" },
  { provider_id: 43, provider_name: "Starz", logo_path: "/pgr09v9v3GfLIpP2xKrXYnJ0cbr.jpg" },
  { provider_id: 526, provider_name: "AMC Plus", logo_path: "/xlonQMSmhtA2HHwK3JKF9ghx7M8.jpg" },
  { provider_id: 151, provider_name: "BritBox", logo_path: "/aGIS8maEjjOENMFoJMFBR2mYK7u.jpg" },
  { provider_id: 73, provider_name: "Tubi TV", logo_path: "/w1T8s7FqPn0KGnETiNc9emZ1GAl.jpg" },
  { provider_id: 584, provider_name: "Discovery Plus", logo_path: "/1fOAgfRtF0g7BkNBnKOApSNqzJz.jpg" },
];

export function StreamingSubscriptions({
  familyId,
  current,
  showProviders,
}: {
  familyId: string;
  current: FamilySubscription[];
  showProviders: { provider_id: number; provider_name: string; logo_path: string }[];
}) {
  const allProviders = mergeProviders(showProviders);
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
  fromShows: { provider_id: number; provider_name: string; logo_path: string }[],
) {
  const map = new Map<number, { provider_id: number; provider_name: string; logo_path: string }>();
  for (const p of COMMON_PROVIDERS) map.set(p.provider_id, p);
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
