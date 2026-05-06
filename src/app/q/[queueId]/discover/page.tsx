import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getQueueById, getFamilySubscriptions } from "@/lib/families/queries";
import { DiscoverBox } from "./DiscoverBox";

export const metadata = {
  title: "Discover · Chillflix",
};

interface PageProps {
  params: Promise<{ queueId: string }>;
}

export default async function DiscoverPage({ params }: PageProps) {
  const { queueId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const queue = await getQueueById(queueId);
  if (!queue) redirect("/");

  const subscriptions = await getFamilySubscriptions(queue.family_id);

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
      <p className="text-sm text-[color:var(--muted)] mb-6">
        Describe what you&apos;re in the mood for and we&apos;ll suggest something to watch.
      </p>
      <DiscoverBox
        queueId={queueId}
        subscriptions={subscriptions.map((s) => ({
          providerId: s.provider_id,
          providerName: s.provider_name,
        }))}
      />
    </div>
  );
}
