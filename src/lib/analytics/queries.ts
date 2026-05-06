import { getTurso } from "@/lib/turso/client";
import { getFamilyByUserId } from "@/lib/families/queries";
import type { StoredWatchProvider } from "@/lib/tmdb/types";

export interface ProviderAnalytics {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  monthly_cost: number | null;
  active_count: number;
  watched_count: number;
}

export interface AnalyticsData {
  providers: ProviderAnalytics[];
  totals: {
    all: number;
    active: number;
    watched: number;
    in_progress: number;
    movies: number;
    tv_shows: number;
  };
  status_counts: Record<string, number>;
  ratings: Record<number, number>;
}

export async function getAnalyticsData(userId: string): Promise<AnalyticsData | null> {
  const family = await getFamilyByUserId(userId);
  if (!family) return null;

  const db = getTurso();

  const [showsResult, subsResult] = await Promise.all([
    db.execute({
      sql: `SELECT
              qs.archived,
              qs.rating,
              qs.current_season,
              qs.current_episode,
              s.media_type,
              s.status,
              s.watch_providers
            FROM queue_shows qs
            JOIN shows s ON qs.show_id = s.id
            JOIN queues q ON qs.queue_id = q.id
            WHERE q.family_id = ?`,
      args: [family.id],
    }),
    db.execute({
      sql: "SELECT provider_id, provider_name, logo_path, monthly_cost FROM family_subscriptions WHERE family_id = ? ORDER BY provider_name ASC",
      args: [family.id],
    }),
  ]);

  const subscriptions = subsResult.rows.map((r) => ({
    provider_id: r.provider_id as number,
    provider_name: r.provider_name as string,
    logo_path: r.logo_path as string,
    monthly_cost: (r.monthly_cost as number | null) ?? null,
  }));

  const providerStats = new Map<number, ProviderAnalytics>(
    subscriptions.map((s) => [s.provider_id, { ...s, active_count: 0, watched_count: 0 }]),
  );

  let all = 0, active = 0, watched = 0, in_progress = 0, movies = 0, tv_shows = 0;
  const status_counts: Record<string, number> = {};
  const ratings: Record<number, number> = {};

  for (const row of showsResult.rows) {
    all++;
    const isArchived = (row.archived as number) === 1;

    if (isArchived) {
      watched++;
      if (row.rating !== null) {
        const r = row.rating as number;
        ratings[r] = (ratings[r] ?? 0) + 1;
      }
    } else {
      active++;
      if (row.current_season !== null || row.current_episode !== null) in_progress++;
    }

    if ((row.media_type as string) === "movie") movies++;
    else tv_shows++;

    const status = (row.status as string) || "Unknown";
    status_counts[status] = (status_counts[status] ?? 0) + 1;

    if (row.watch_providers) {
      const providers = JSON.parse(row.watch_providers as string) as StoredWatchProvider[];
      for (const p of providers) {
        const stat = providerStats.get(p.provider_id);
        if (stat) {
          if (isArchived) stat.watched_count++;
          else stat.active_count++;
        }
      }
    }
  }

  return {
    providers: Array.from(providerStats.values()),
    totals: { all, active, watched, in_progress, movies, tv_shows },
    status_counts,
    ratings,
  };
}
