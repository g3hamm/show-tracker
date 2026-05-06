import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getShowById, getShowAcrossQueues } from "@/lib/shows/queries";
import { getQueueById, getFamilySubscriptions } from "@/lib/families/queries";
import { tmdbPoster } from "@/lib/tmdb/client";
import { formatShortDate, relativeDay } from "@/lib/dates";
import { RemoveShowButton } from "@/components/RemoveShowButton";
import { ArchiveToggle } from "@/components/ArchiveToggle";
import { EpisodeProgressForm } from "@/components/EpisodeProgressForm";
import { StarRating } from "@/components/StarRating";
import { WatchProviders } from "@/components/WatchProviders";
import { CrossQueueProgress } from "@/components/CrossQueueProgress";
import { PrivateToggle } from "@/components/PrivateToggle";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ queueId: string; id: string }>;
}

export default async function ShowDetailPage({ params }: PageProps) {
  const { queueId, id } = await params;
  const { userId } = await auth();
  const show = await getShowById(queueId, id);
  if (!show) notFound();

  const queue = await getQueueById(queueId);
  const isSoloQueue = queue?.type === "solo" && queue.owner_id === userId;

  const [crossQueue, subscriptions] = await Promise.all([
    queue ? getShowAcrossQueues(id, queue.family_id, queueId) : [],
    queue ? getFamilySubscriptions(queue.family_id) : [],
  ]);

  const subscribedIds = new Set(subscriptions.map((s) => s.provider_id));
  const poster = tmdbPoster(show.poster_path, "w500");
  const isMovie = show.media_type === "movie";

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      <Link
        href={`/q/${queueId}`}
        className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors mb-6 inline-block"
      >
        &larr; Back to dashboard
      </Link>

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
              <WatchProviders
                providers={show.watch_providers}
                size="md"
                subscribedIds={subscribedIds.size > 0 ? subscribedIds : undefined}
              />
            </div>
          )}

          {show.justwatch_url && (
            <a
              href={show.justwatch_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#e85e2a] text-white text-sm font-semibold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
              </svg>
              Watch on JustWatch
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
              </svg>
            </a>
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
                  showId={show.queue_show_id}
                  currentSeason={show.current_season}
                  currentEpisode={show.current_episode}
                />
              </div>
            </>
          )}

          {crossQueue.length > 0 && (
            <div className="mt-6">
              <CrossQueueProgress entries={crossQueue} />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <ArchiveToggle id={show.queue_show_id} archived={show.archived} />
            <RemoveShowButton id={show.queue_show_id} />
            {isSoloQueue && (
              <PrivateToggle queueShowId={show.queue_show_id} isPrivate={show.is_private} />
            )}
          </div>

          {show.archived && (
            <div className="mt-6 p-4 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)]">
              <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-2">Rating & Review</p>
              <StarRating showId={show.queue_show_id} rating={show.rating} review={show.review} />
            </div>
          )}

          <p className="text-[10px] text-[color:var(--muted)] mt-6">
            Last refreshed {new Date(show.last_refreshed_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
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
