import type { StoredWatchProvider } from "@/lib/tmdb/types";

// Suffixes that indicate a channel add-on or reseller — strip to get the base service.
const CHANNEL_SUFFIXES = [
  " Amazon Channel",
  " Apple TV Channel",
  " Apple Channel",
  " Roku Channel",
  " Roku Premium Channel",
  " Microsoft Channel",
  " fuboTV Channel",
  " Spectrum On Demand",
];

// Explicit name overrides after suffix stripping (lowercase → canonical display name).
const CANONICAL_NAMES: Record<string, string> = {
  // Netflix tiers
  "netflix basic with ads":    "Netflix",
  "netflix standard with ads": "Netflix",
  "netflix standard":          "Netflix",
  // Hulu tiers
  "hulu (no ads)":             "Hulu",
  // Peacock tiers
  "peacock premium":           "Peacock",
  "peacock premium plus":      "Peacock",
  // Paramount — normalise name AND "Plus" vs "+"
  "paramount+":                "Paramount+",
  "paramount plus":            "Paramount+",
  "paramount+ essential":      "Paramount+",
  "paramount+ premium":        "Paramount+",
  "paramount plus essential":  "Paramount+",
  "paramount plus premium":    "Paramount+",
  // HBO → Max rebrand
  "hbo max":                   "Max",
  "hbo now":                   "Max",
  "hbo go":                    "Max",
  // Amazon
  "amazon prime video with ads": "Amazon Prime Video",
  "amazon video":              "Amazon Prime Video",
  // Disney name variants
  "disney plus":               "Disney+",
  // Apple name variants
  "apple tv plus":             "Apple TV+",
  // AMC
  "amc plus":                  "AMC+",
  // ESPN
  "espn plus":                 "ESPN+",
  // MGM
  "mgm plus":                  "MGM+",
  "epix":                      "MGM+",
};

export function canonicalProviderName(name: string): string {
  // Strip channel/reseller suffixes first (iterate so we handle stacked suffixes)
  let normalized = name;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of CHANNEL_SUFFIXES) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length).trim();
        changed = true;
      }
    }
  }
  // Apply explicit canonical override if one exists
  return CANONICAL_NAMES[normalized.toLowerCase()] ?? normalized;
}

/**
 * Deduplicate a provider list by canonical name.
 * Assumes the input is already sorted by display_priority so the most
 * canonical entry (lowest priority number = highest rank) comes first.
 */
export function normalizeProviders(
  providers: StoredWatchProvider[],
): StoredWatchProvider[] {
  const seen = new Map<string, StoredWatchProvider>();
  for (const p of providers) {
    const canonical = canonicalProviderName(p.provider_name);
    if (!seen.has(canonical)) {
      seen.set(canonical, { ...p, provider_name: canonical });
    }
  }
  return Array.from(seen.values());
}
