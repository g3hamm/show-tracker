import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  getFamilyByUserId,
  getFamilySubscriptions,
  getUniqueProvidersFromShows,
} from "@/lib/families/queries";
import { tmdbGetWatchProviderList } from "@/lib/tmdb/client";
import { StreamingSubscriptions } from "@/components/family/StreamingSubscriptions";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const family = await getFamilyByUserId(userId);
  if (!family) redirect("/family/setup");

  const [subscriptions, showProviders, tmdbProviders] = await Promise.all([
    getFamilySubscriptions(family.id),
    getUniqueProvidersFromShows(),
    tmdbGetWatchProviderList().catch(() => []),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">My Subscriptions</h1>
      <p className="text-sm text-[color:var(--muted)] mb-6">
        Which streaming services does your household have access to? Shows on your services will be highlighted.
      </p>

      <div className="flex items-stretch gap-3 mb-8 p-4 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="flex-1">
          <p className="text-sm font-medium mb-0.5">Import from Rocket Money</p>
          <p className="text-xs text-[color:var(--muted)]">Automatically detect your streaming subscriptions from your linked accounts.</p>
        </div>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex-shrink-0 self-center flex items-center gap-2 px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white text-sm font-semibold opacity-40 cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
          </svg>
          Import
        </button>
      </div>

      <p className="text-xs text-[color:var(--muted)] mb-3">Or select manually:</p>

      <StreamingSubscriptions
        familyId={family.id}
        current={subscriptions}
        showProviders={showProviders}
        tmdbProviders={tmdbProviders}
      />
    </div>
  );
}
