import Image from "next/image";
import Link from "next/link";
import type { ShowRow } from "@/lib/shows/types";
import { tmdbPoster } from "@/lib/tmdb/client";
import { formatShortDate, relativeDay, todayInAppTz } from "@/lib/dates";
import { WatchProviders } from "./WatchProviders";
import { RemoveShowButton } from "./RemoveShowButton";
import { ArchiveToggle } from "./ArchiveToggle";

interface ShowCardProps {
  show: ShowRow;
  badge?: "new" | "soon";
}

export function ShowCard({ show, badge }: ShowCardProps) {
  const poster = tmdbPoster(show.poster_path, "w342");
  const today = todayInAppTz();
  const isMovie = show.media_type === "movie";

  let badgeText: string | null = null;
  let subline: string | null = null;

  if (isMovie) {
    // Movies: show release year and status
    if (show.first_air_date) {
      subline = show.first_air_date.slice(0, 4);
    }
    if (show.status && show.status !== "Released") {
      subline = subline ? `${subline} · ${show.status}` : show.status;
    }
  } else if (badge === "new" && show.last_air_date) {
    badgeText = "NEW";
    const ep = show.last_episode;
    subline = ep
      ? `S${ep.season_number}E${ep.episode_number} · ${relativeDay(show.last_air_date, today)}`
      : relativeDay(show.last_air_date, today);
  } else if (badge === "soon" && show.next_air_date) {
    badgeText = "SOON";
    const ep = show.next_episode;
    subline = ep
      ? `S${ep.season_number}E${ep.episode_number} · ${relativeDay(show.next_air_date, today)}`
      : relativeDay(show.next_air_date, today);
  } else if (show.current_season != null && show.current_episode != null) {
    subline = `On S${show.current_season}E${show.current_episode}`;
    if (show.next_air_date) {
      subline += ` · Next: ${formatShortDate(show.next_air_date)}`;
    }
  } else if (show.next_air_date) {
    subline = `Next: ${formatShortDate(show.next_air_date)}`;
  } else if (show.status) {
    subline = show.status;
  }

  return (
    <div className="group relative flex flex-col rounded overflow-hidden bg-[color:var(--surface)] border border-transparent hover:scale-105 hover:shadow-xl hover:shadow-black/50 hover:z-10 transition-all duration-200">
      <Link href={`/show/${show.id}`} className="block">
        <div className="aspect-[2/3] relative bg-[color:var(--surface-elevated)]">
          {poster ? (
            <Image
              src={poster}
              alt={show.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[color:var(--muted)] text-xs p-2 text-center">
              {show.name}
            </div>
          )}
          {isMovie && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-600/80 text-white">
              MOVIE
            </span>
          )}
          {!isMovie && badgeText && (
            <span
              className={
                "absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider " +
                (badge === "new"
                  ? "bg-[color:var(--accent)] text-white"
                  : "bg-amber-500 text-black")
              }
            >
              {badgeText}
            </span>
          )}
          {show.archived && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold tracking-wider text-[color:var(--muted)]">
              ARCHIVED
            </span>
          )}
        </div>
        <div className="p-3 pb-2">
          <h3 className="font-medium text-sm truncate">{show.name}</h3>
          {subline && (
            <p className="text-xs text-[color:var(--muted)] truncate mt-0.5">
              {subline}
            </p>
          )}
          <div className="mt-1">
            <WatchProviders providers={show.watch_providers} size="sm" />
          </div>
          {show.recommended_by && (
            <p className="text-[10px] text-amber-400 truncate mt-1">
              Rec&apos;d by {show.recommended_by}
            </p>
          )}
          {show.recommendation_note && (
            <p className="text-[10px] text-[color:var(--foreground)]/60 italic truncate mt-0.5">
              &ldquo;{show.recommendation_note}&rdquo;
            </p>
          )}
          {show.added_by_name && !show.recommended_by && (
            <p className="text-[10px] text-[color:var(--muted)] truncate mt-1">
              Added by {show.added_by_name}
            </p>
          )}
        </div>
      </Link>
      <div className="px-3 pb-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArchiveToggle id={show.id} archived={show.archived} />
        <RemoveShowButton id={show.id} />
      </div>
    </div>
  );
}
