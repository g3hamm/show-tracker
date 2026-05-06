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
  avg_rating: number | null;
  days_since_last_watch: number | null;
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
  genre_counts: Record<string, number>;
  platform_counts: Record<string, number>;
}

export async function getAnalyticsData(userId: string): Promise<AnalyticsData | null> {
  const family = await getFamilyByUserId(userId);
  if (!family) return null;

  const db = getTurso();

  // Check whether optional columns exist (may not be migrated on existing installs)
  const [qsPragma, showsPragma] = await Promise.all([
    db.execute("PRAGMA table_info(queue_shows)"),
    db.execute("PRAGMA table_info(shows)"),
  ]);
  const hasArchivedAt = qsPragma.rows.some((r) => r.name === "archived_at");
  const hasGenres = showsPragma.rows.some((r) => r.name === "genres");

  const [showsResult, subsResult] = await Promise.all([
    db.execute({
      sql: `SELECT
              qs.archived,
              qs.rating,
              qs.current_season,
              qs.current_episode,
              ${hasArchivedAt ? "qs.archived_at," : "NULL as archived_at,"}
              s.media_type,
              s.status,
              s.watch_providers,
              ${hasGenres ? "s.genres" : "NULL as genres"}
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

  interface ProviderAccum extends ProviderAnalytics {
    rating_sum: number;
    rating_count: number;
    last_watched_at: string | null;
  }

  const providerStats = new Map<number, ProviderAccum>(
    subscriptions.map((s) => [
      s.provider_id,
      {
        ...s,
        active_count: 0,
        watched_count: 0,
        avg_rating: null,
        days_since_last_watch: null,
        rating_sum: 0,
        rating_count: 0,
        last_watched_at: null,
      },
    ]),
  );

  let all = 0, active = 0, watched = 0, in_progress = 0, movies = 0, tv_shows = 0;
  const status_counts: Record<string, number> = {};
  const ratings: Record<number, number> = {};
  const genre_counts: Record<string, number> = {};
  const platform_counts: Record<string, number> = {};

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

    if (row.genres) {
      try {
        const genres = JSON.parse(row.genres as string) as string[];
        for (const g of genres) {
          genre_counts[g] = (genre_counts[g] ?? 0) + 1;
        }
      } catch {
        // skip malformed genre data
      }
    }

    if (row.watch_providers) {
      let providers: StoredWatchProvider[] = [];
      try {
        providers = JSON.parse(row.watch_providers as string) as StoredWatchProvider[];
      } catch {
        // skip malformed provider data
      }
      for (const p of providers) {
        platform_counts[p.provider_name] = (platform_counts[p.provider_name] ?? 0) + 1;

        const stat = providerStats.get(p.provider_id);
        if (stat) {
          if (isArchived) {
            stat.watched_count++;
            if (row.rating !== null) {
              stat.rating_sum += row.rating as number;
              stat.rating_count++;
            }
            const archivedAt = row.archived_at as string | null;
            if (archivedAt && (!stat.last_watched_at || archivedAt > stat.last_watched_at)) {
              stat.last_watched_at = archivedAt;
            }
          } else {
            stat.active_count++;
          }
        }
      }
    }
  }

  const now = new Date();
  const providers: ProviderAnalytics[] = Array.from(providerStats.values()).map((s) => {
    const avg_rating = s.rating_count > 0 ? s.rating_sum / s.rating_count : null;
    let days_since_last_watch: number | null = null;
    if (s.last_watched_at) {
      const diff = now.getTime() - new Date(s.last_watched_at).getTime();
      days_since_last_watch = Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    return {
      provider_id: s.provider_id,
      provider_name: s.provider_name,
      logo_path: s.logo_path,
      monthly_cost: s.monthly_cost,
      active_count: s.active_count,
      watched_count: s.watched_count,
      avg_rating,
      days_since_last_watch,
    };
  });

  return {
    providers,
    totals: { all, active, watched, in_progress, movies, tv_shows },
    status_counts,
    ratings,
    genre_counts,
    platform_counts,
  };
}
