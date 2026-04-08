import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShowById } from "@/lib/shows/queries";
import { tmdbPoster } from "@/lib/tmdb/client";
import { formatShortDate, relativeDay } from "@/lib/dates";
import { RemoveShowButton } from "@/components/RemoveShowButton";
import { ArchiveToggle } from "@/components/ArchiveToggle";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShowDetailPage({ params }: PageProps) {
  const { id } = await params;
  const show = await getShowById(id);
  if (!show) notFound();

  const poster = tmdbPoster(show.poster_path, "w500");

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 sm:p-8">
      <Link
        href="/"
        className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
      >
        ← Dashboard
      </Link>

      <div className="grid md:grid-cols-[200px_1fr] gap-6 mt-6">
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
          <h1 className="text-2xl sm:text-3xl font-semibold">{show.name}</h1>
          <div className="flex gap-3 text-xs text-[color:var(--muted)] mt-1 flex-wrap">
            {show.first_air_date && (
              <span>First aired {show.first_air_date.slice(0, 4)}</span>
            )}
            {show.status && <span>· {show.status}</span>}
            {show.added_by_name && <span>· Added by {show.added_by_name}</span>}
          </div>

          {show.overview && (
            <p className="text-sm text-[color:var(--foreground)]/90 mt-4 leading-relaxed">
              {show.overview}
            </p>
          )}

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

          <div className="flex gap-3 mt-6">
            <ArchiveToggle id={show.id} archived={show.archived} />
            <RemoveShowButton id={show.id} />
          </div>

          <p className="text-[10px] text-[color:var(--muted)] mt-6">
            Last refreshed {new Date(show.last_refreshed_at).toLocaleString()}
          </p>
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
