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
import { RefreshNowButton } from "@/components/RefreshNowButton";
import { SignOutButton } from "@/components/SignOutButton";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [newThisWeek, comingSoon, allShows, recommendations, finished] = await Promise.all([
    getNewThisWeek(),
    getComingSoon(),
    getAllTrackedShows(),
    listRecommendations(),
    getFinishedShows(),
  ]);

  return (
    <main className="min-h-screen">
      <header className="bg-[#C01900] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1><Logo /></h1>
            <SignOutButton />
          </div>
          <nav className="flex items-center gap-3 text-sm mt-3">
            <Link
              href="/search"
              className="px-4 py-2 rounded bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors"
            >
              + Add show
            </Link>
            <Link
              href="/recommend"
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Share link
            </Link>
            <RefreshNowButton />
          </nav>
        </div>
      </header>

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
                <RecommendationCard key={rec.id} rec={rec} />
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
                <Link href="/search" className="underline hover:text-[color:var(--accent)]">
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
    </main>
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
