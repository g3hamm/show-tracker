import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { getAnalyticsData } from "@/lib/analytics/queries";
import { tmdbLogo } from "@/lib/tmdb/client";
import { ProviderCostInput } from "@/components/analytics/ProviderCostInput";
import { CrossFilterCharts } from "@/components/analytics/CrossFilterCharts";

export const dynamic = "force-dynamic";

function satisfactionTier(avgRating: number | null, daysSince: number | null, watchedCount: number): "great" | "ok" | "low" | "unknown" {
  if (avgRating === null && watchedCount === 0) return "unknown";
  if (avgRating !== null) {
    if (avgRating >= 4.0) return "great";
    if (avgRating >= 2.5) return "ok";
    return "low";
  }
  // No ratings yet but has watched content — neutral
  if (daysSince !== null && daysSince > 90) return "low";
  return "unknown";
}

const SAT_CONFIG = {
  great:   { face: "😊", label: "Great value",      ring: "ring-emerald-500/40", text: "text-emerald-400", bar: "bg-emerald-500" },
  ok:      { face: "😐", label: "Decent",            ring: "ring-amber-500/40",   text: "text-amber-400",   bar: "bg-amber-500" },
  low:     { face: "😞", label: "Low satisfaction",  ring: "ring-red-500/40",     text: "text-red-400",     bar: "bg-red-500" },
  unknown: { face: "🤔", label: "Not enough data",   ring: "ring-[color:var(--border)]", text: "text-[color:var(--muted)]", bar: "bg-[color:var(--border)]" },
};


const STATUS_ORDER = ["Returning Series", "In Production", "Planned", "Ended", "Canceled", "Unknown"];

const STATUS_COLORS: Record<string, string> = {
  "Returning Series": "bg-emerald-500",
  "In Production": "bg-blue-500",
  "Planned": "bg-blue-400",
  "Ended": "bg-[color:var(--muted)]",
  "Canceled": "bg-red-600",
  "Unknown": "bg-[color:var(--border)]",
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const data = await getAnalyticsData(userId!);
  if (!data) redirect("/family/setup");

  // data is non-null after the redirect above; TypeScript doesn't narrow past redirect().
  const { providers, totals, status_counts, ratings, genre_counts, platform_counts, show_pairs } = data!;

  const totalMonthly = providers.reduce((sum: number, p) => sum + (p.monthly_cost ?? 0), 0);

  const sortedStatuses = (Object.entries(status_counts) as [string, number][]).sort(([a], [b]) => {
    const ai = STATUS_ORDER.indexOf(a);
    const bi = STATUS_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const maxStatusCount = Math.max(...(Object.values(status_counts) as number[]), 1);

  const ratingEntries = (Object.entries(ratings) as [string, number][]).map(
    ([k, v]) => [Number(k), v] as [number, number],
  );
  const maxRatingCount = Math.max(...ratingEntries.map(([, v]) => v), 1);
  const totalRated = ratingEntries.reduce((sum: number, [, v]) => sum + v, 0);
  const avgRating =
    totalRated > 0
      ? ratingEntries.reduce((sum: number, [r, v]) => sum + r * v, 0) / totalRated
      : null;

  const heroStats = [
    { label: "Total added", value: totals.all },
    { label: "Watching", value: totals.active },
    { label: "In progress", value: totals.in_progress },
    { label: "Finished", value: totals.watched },
    { label: "TV shows", value: totals.tv_shows },
    { label: "Movies", value: totals.movies },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Link
          href={`/q/${queueId}`}
          className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
        >
          ← Back
        </Link>
      </div>
      <p className="text-[color:var(--muted)] text-sm mb-8">
        Family-wide stats across all queues.
      </p>

      {/* Hero stat cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-10">
        {heroStats.map(({ label, value }) => (
          <div key={label} className="bg-[color:var(--surface)] rounded-xl p-4">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-[color:var(--muted)] mt-1 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Streaming Services */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold">Streaming Services</h2>
          {totalMonthly > 0 && (
            <span className="text-sm text-[color:var(--muted)]">
              <span className="font-semibold text-[color:var(--foreground)]">
                ${totalMonthly.toFixed(2)}
              </span>{" "}
              / month total
            </span>
          )}
        </div>

        {providers.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            No streaming services configured.{" "}
            <Link href="/family/subscriptions" className="underline hover:text-[color:var(--foreground)]">
              Add them in My Subscriptions.
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => {
              const logoSrc = tmdbLogo(p.logo_path, "w92");
              const total = p.active_count + p.watched_count;
              const utilPct = total > 0 ? (p.watched_count / total) * 100 : 0;
              const costPerWatched =
                p.monthly_cost && p.monthly_cost > 0 && p.watched_count > 0
                  ? p.monthly_cost / p.watched_count
                  : null;
              const tier = satisfactionTier(p.avg_rating, p.days_since_last_watch, p.watched_count);
              const sat = SAT_CONFIG[tier];

              return (
                <div
                  key={p.provider_id}
                  className={`bg-[color:var(--surface)] rounded-xl p-4 flex flex-col gap-3 ring-1 ${sat.ring}`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {logoSrc && (
                        <Image
                          src={logoSrc}
                          alt={p.provider_name}
                          width={40}
                          height={40}
                          className="rounded-lg flex-shrink-0"
                        />
                      )}
                      <span className="font-medium text-sm leading-tight">{p.provider_name}</span>
                    </div>
                    <span
                      className="text-xl leading-none"
                      title={sat.label}
                    >
                      {sat.face}
                    </span>
                  </div>

                  {/* Counts */}
                  <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                    <span>
                      <span className="font-semibold text-[color:var(--foreground)]">
                        {p.active_count}
                      </span>{" "}
                      watching
                    </span>
                    <span>
                      <span className="font-semibold text-[color:var(--foreground)]">
                        {p.watched_count}
                      </span>{" "}
                      finished
                    </span>
                  </div>

                  {/* Utilization bar — finished share of total */}
                  <div>
                    <div className="h-1.5 bg-[color:var(--border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${sat.bar} rounded-full transition-all`}
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                    {total > 0 && (
                      <div className="text-[10px] text-[color:var(--muted)] mt-1">
                        {Math.round(utilPct)}% finished
                      </div>
                    )}
                  </div>

                  {/* Avg rating + days since last watch */}
                  <div className="flex items-center justify-between text-xs">
                    {p.avg_rating !== null ? (
                      <span className={sat.text + " font-medium"}>
                        ★ {p.avg_rating.toFixed(1)}{" "}
                        <span className="text-[color:var(--muted)] font-normal">avg rating / 5</span>
                      </span>
                    ) : (
                      <span className="text-[color:var(--muted)]">No ratings yet</span>
                    )}
                    {p.days_since_last_watch !== null ? (
                      <span className="text-[color:var(--muted)]">
                        Last watched{" "}
                        <span className="text-[color:var(--foreground)] font-medium">
                          {p.days_since_last_watch === 0
                            ? "today"
                            : p.days_since_last_watch === 1
                            ? "1d ago"
                            : `${p.days_since_last_watch}d ago`}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[color:var(--muted)]">Never finished</span>
                    )}
                  </div>

                  {/* Cost row */}
                  <div className="flex items-center justify-between">
                    <ProviderCostInput
                      providerId={p.provider_id}
                      initialCost={p.monthly_cost ?? null}
                    />
                    {costPerWatched !== null && (
                      <span className="text-xs text-[color:var(--muted)]">
                        ${costPerWatched.toFixed(2)} / watched
                      </span>
                    )}
                  </div>

                  {/* Cancel nudge */}
                  {tier === "low" && p.monthly_cost && p.monthly_cost > 0 && (
                    <div className="pt-1 border-t border-[color:var(--border)]">
                      <p className="text-[10px] text-red-400 leading-snug">
                        Consider cancelling — low satisfaction and ${p.monthly_cost.toFixed(2)}/mo adds up.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pie charts — Genres & Platforms (cross-filterable) */}
      {(Object.keys(genre_counts).length > 0 || Object.keys(platform_counts).length > 0) && (
        <CrossFilterCharts
          genreCounts={genre_counts}
          platformCounts={platform_counts}
          showPairs={show_pairs}
        />
      )}

      {/* Lower two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Show Status breakdown */}
        {sortedStatuses.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Show Status</h2>
            <div className="bg-[color:var(--surface)] rounded-xl p-4 flex flex-col gap-4">
              {sortedStatuses.map(([status, count]) => {
                const barColor = STATUS_COLORS[status] ?? "bg-[color:var(--muted)]";
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span>{status}</span>
                      <span className="text-[color:var(--muted)] tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 bg-[color:var(--border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all`}
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Ratings distribution */}
        {totalRated > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Ratings</h2>
              {avgRating !== null && (
                <span className="text-sm text-[color:var(--muted)]">
                  avg{" "}
                  <span className="font-semibold text-[color:var(--foreground)]">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-[color:var(--muted)]"> / 5</span>
                </span>
              )}
            </div>
            <div className="bg-[color:var(--surface)] rounded-xl p-4">
              <div className="flex items-end gap-1 h-28">
                {Array.from({ length: 5 }, (_, i) => i + 1).map((r) => {
                  const count = ratings[r] ?? 0;
                  const heightPct = count > 0 ? (count / maxRatingCount) * 100 : 0;
                  return (
                    <div key={r} className="flex flex-col items-center gap-1 flex-1 h-full">
                      <div className="relative w-full flex-1">
                        {count > 0 && (
                          <div
                            className="absolute bottom-0 w-full bg-[#C01900] rounded-t-sm transition-all"
                            style={{ height: `${heightPct}%` }}
                            title={`${count} show${count !== 1 ? "s" : ""} rated ${r}`}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-[color:var(--muted)] leading-none">{r}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[color:var(--muted)] mt-3 text-center">
                {totalRated} show{totalRated !== 1 ? "s" : ""} rated
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
