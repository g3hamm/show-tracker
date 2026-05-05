import Link from "next/link";
import {
  getNewThisWeek,
  getComingSoon,
  getAllTrackedShows,
  getFinishedShows,
} from "@/lib/shows/queries";
import { listRecommendations } from "@/lib/recommendations/queries";
import { ShowGrid } from "@/components/ShowGrid";
import { RecommendationCard } from "@/components/RecommendationCard";
import { FinishedSection } from "@/components/FinishedSection";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ queueId: string }>;
}

export default async function QueueDashboardPage({ params }: PageProps) {
  const { queueId } = await params;

  const [newThisWeek, comingSoon, allShows, recommendations, finished] = await Promise.all([
    getNewThisWeek(queueId),
    getComingSoon(queueId),
    getAllTrackedShows(queueId),
    listRecommendations(),
    getFinishedShows(queueId),
  ]);

  return (
    <div className="py-6 sm:py-8">
      <Section
        title="New this week"
        subtitle="Episodes that aired in the last 7 days."
        fullWidth
      >
        <ShowGrid
          shows={newThisWeek}
          badge="new"
          emptyMessage="No new episodes this week."
        />
      </Section>

      <Section
        title="Coming soon"
        subtitle="Next 14 days."
        fullWidth
      >
        <ShowGrid
          shows={comingSoon}
          badge="soon"
          emptyMessage="Nothing on the horizon."
        />
      </Section>

      <Section
        title="Recommended to us"
        subtitle="Submissions from friends and family."
      >
        {recommendations.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)] italic">
            No recommendations yet. Share{" "}
            <Link href="/recommend" className="underline hover:text-[color:var(--accent)]">
              /recommend
            </Link>{" "}
            with someone.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} queueId={queueId} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="All tracked shows"
        subtitle={`${allShows.length} show${allShows.length === 1 ? "" : "s"}.`}
        fullWidth
      >
        {allShows.length === 0 ? (
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <p className="text-sm text-[color:var(--muted)] italic">
              No shows yet.{" "}
              <Link href={`/q/${queueId}/search`} className="underline hover:text-[color:var(--accent)]">
                Add one
              </Link>
              .
            </p>
          </div>
        ) : (
          <ShowGrid shows={allShows} />
        )}
      </Section>

      <Section
        title="Finished"
        subtitle={`${finished.length} watched — rate and review.`}
      >
        <FinishedSection shows={finished} />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  fullWidth,
  children,
}: {
  title: string;
  subtitle?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12 last:mb-0">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[color:var(--muted)]">{subtitle}</p>
        )}
      </div>
      {fullWidth ? (
        children
      ) : (
        <div className="max-w-7xl mx-auto px-6 sm:px-8">{children}</div>
      )}
    </section>
  );
}
