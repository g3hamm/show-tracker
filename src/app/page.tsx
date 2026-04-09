import Link from "next/link";
import {
  getNewThisWeek,
  getComingSoon,
  getAllTrackedShows,
} from "@/lib/shows/queries";
import { listRecommendations } from "@/lib/recommendations/queries";
import { ShowGrid } from "@/components/ShowGrid";
import { RecommendationCard } from "@/components/RecommendationCard";
import { RefreshNowButton } from "@/components/RefreshNowButton";
import { SignOutButton } from "@/components/SignOutButton";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [newThisWeek, comingSoon, allShows, recommendations] = await Promise.all([
    getNewThisWeek(),
    getComingSoon(),
    getAllTrackedShows(),
    listRecommendations(),
  ]);

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-6 sm:p-8">
      <header className="flex items-center justify-between mb-10 flex-wrap gap-3">
        <div>
          <h1><Logo /></h1>
          <p className="text-sm text-[color:var(--muted)]">
            What we&apos;re watching.
          </p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/search"
            className="px-4 py-2 rounded bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-semibold transition-colors"
          >
            + Add show
          </Link>
          <Link
            href="/recommend"
            className="px-4 py-2 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--border)] text-[color:var(--foreground)] transition-colors"
          >
            Share link
          </Link>
          <RefreshNowButton />
          <SignOutButton />
        </nav>
      </header>

      <Section
        title="New this week"
        subtitle="Episodes that aired in the last 7 days."
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
      >
        {allShows.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)] italic">
            No shows yet.{" "}
            <Link href="/search" className="underline hover:text-[color:var(--accent)]">
              Add one
            </Link>
            .
          </p>
        ) : (
          <ShowGrid shows={allShows} />
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[color:var(--muted)]">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
