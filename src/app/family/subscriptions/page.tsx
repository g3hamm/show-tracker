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
      <p className="text-xs text-[color:var(--muted)] mb-8">
        Which streaming services does your household pay for? Shows available on your services will be highlighted.
      </p>

      <StreamingSubscriptions
        familyId={family.id}
        current={subscriptions}
        showProviders={showProviders}
        tmdbProviders={tmdbProviders}
      />
    </div>
  );
}
