import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShowById } from "@/lib/shows/queries";
import { tmdbPoster } from "@/lib/tmdb/client";
import { formatShortDate, relativeDay } from "@/lib/dates";
import { RemoveShowButton } from "@/components/RemoveShowButton";
import { ArchiveToggle } from "@/components/ArchiveToggle";
import { EpisodeProgressForm } from "@/components/EpisodeProgressForm";
import { StarRating } from "@/components/StarRating";
import { WatchProviders } from "@/components/WatchProviders";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShowDetailPage({ params }: PageProps) {
  const { id } = await params;
  const show = await getShowById(id);
  if (!show) notFound();

  const poster = tmdbPoster(show.poster_path, "w500");
  const isMovie = show.media_type === "movie";

  return (
    <main className="min-h-screen">
      <div className="bg-[#C01900] shadow-lg">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="w-full max-w-[200px] aspect-[2/3] relative rounded-lg overflow-hidden bg-[color:var(--surface-elevated)]">
          {poster && (
            <Image
              src={poster}
              alt={show.name}
              fill
              sizes="200px"
              className="object-cover"
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{show.name}</h1>
            {isMovie && (
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400">
                Movie
              </span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-[color:var(--muted)] mt-1 flex-wrap">
            {show.first_air_date && (
              <span>{isMovie ? "Released" : "First aired"} {show.first_air_date.slice(0, 4)}</span>
            )}
            {show.status && <span>· {show.status}</span>}
            {show.added_by_name && <span>· Added by {show.added_by_name}</span>}
          </div>
          {show.recommended_by && (
            <p className="text-xs text-amber-400 mt-2">
              Recommended by {show.recommended_by}
            </p>
          )}
          {show.recommendation_note && (
            <p className="text-sm text-[color:var(--foreground)]/70 italic mt-1">
              &ldquo;{show.recommendation_note}&rdquo;
            </p>
          )}

          {show.overview && (
            <p className="text-sm text-[color:var(--foreground)]/90 mt-4 leading-relaxed">
              {show.overview}
            </p>
          )}

          {show.watch_providers && show.watch_providers.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-1.5">
                Streaming on
              </p>
              <WatchProviders providers={show.watch_providers} size="md" />
            </div>
          )}

          {!isMovie && (
            <>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <EpisodeBox
                  label="Last aired"
                  episode={show.last_episode}
                  date={show.last_air_date}
                  emptyText="No episodes aired yet."
                />
                <EpisodeBox
                  label="Next episode"
                  episode={show.next_episode}
                  date={show.next_air_date}
                  emptyText="No upcoming episode scheduled."
                />
              </div>

              <div className="mt-6">
                <EpisodeProgressForm
                  showId={show.id}
                  currentSeason={show.current_season}
                  currentEpisode={show.current_episode}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6">
            <ArchiveToggle id={show.id} archived={show.archived} />
            <RemoveShowButton id={show.id} />
          </div>

          {show.archived && (
            <div className="mt-6 p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
              <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-2">Rating & Review</p>
              <StarRating showId={show.id} rating={show.rating} review={show.review} />
            </div>
          )}

          <p className="text-[10px] text-[color:var(--muted)] mt-6">
            Last refreshed {new Date(show.last_refreshed_at).toLocaleString()}
          </p>
        </div>
      </div>
      </div>
    </main>
  );
}

interface EpisodeBoxProps {
  label: string;
  episode: { name: string; season_number: number; episode_number: number } | null;
  date: string | null;
  emptyText: string;
}

function EpisodeBox({ label, episode, date, emptyText }: EpisodeBoxProps) {
  return (
    <div className="p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
      <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-1">
        {label}
      </p>
      {episode && date ? (
        <div>
          <p className="text-sm font-medium">
            S{episode.season_number}E{episode.episode_number} &middot; {episode.name}
          </p>
          <p className="text-xs text-[color:var(--muted)] mt-1">
            {formatShortDate(date)} ({relativeDay(date)})
          </p>
        </div>
      ) : (
        <p className="text-xs text-[color:var(--muted)] italic">{emptyText}</p>
      )}
    </div>
  );
}
