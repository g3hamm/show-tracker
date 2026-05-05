import Image from "next/image";
import { tmdbLogo } from "@/lib/tmdb/client";
import type { StoredWatchProvider } from "@/lib/tmdb/types";

interface WatchProvidersProps {
  providers: StoredWatchProvider[] | null;
  size?: "sm" | "md";
  subscribedIds?: Set<number>;
}

export function WatchProviders({ providers, size = "sm", subscribedIds }: WatchProvidersProps) {
  if (!providers || providers.length === 0) return null;

  const logoSize = size === "sm" ? "w45" : "w92";
  const imgClass = size === "sm"
    ? "w-5 h-5 rounded-[4px]"
    : "w-8 h-8 rounded-md";
  const max = size === "sm" ? 4 : 8;
  const shown = providers.slice(0, max);
  const overflow = providers.length > max ? providers.length - max : 0;

  return (
    <div
      className="flex items-center gap-1.5"
      title={providers.map((p) => p.provider_name).join(", ")}
    >
      {shown.map((p) => {
        const src = tmdbLogo(p.logo_path, logoSize);
        if (!src) return null;
        const dimmed = subscribedIds && !subscribedIds.has(p.provider_id);
        return (
          <Image
            key={p.provider_id}
            src={src}
            alt={p.provider_name}
            width={size === "sm" ? 20 : 32}
            height={size === "sm" ? 20 : 32}
            className={`${imgClass} ${dimmed ? "opacity-30 grayscale" : ""}`}
            title={`${p.provider_name}${dimmed ? " (not subscribed)" : ""}`}
          />
        );
      })}
      {overflow > 0 && (
        <span className="text-[10px] text-[color:var(--muted)]">+{overflow}</span>
      )}
    </div>
  );
}
