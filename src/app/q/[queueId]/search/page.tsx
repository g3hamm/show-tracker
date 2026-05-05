import { auth } from "@clerk/nextjs/server";
import { getQueueById } from "@/lib/families/queries";
import { getFamilyTrackingStatus } from "@/lib/shows/queries";
import { SearchBox } from "./SearchBox";

export const metadata = {
  title: "Add a show · HAMMFLIX",
};

interface PageProps {
  params: Promise<{ queueId: string }>;
}

export default async function SearchPage({ params }: PageProps) {
  const { queueId } = await params;
  await auth();

  const queue = await getQueueById(queueId);
  const trackingStatus = queue
    ? await getFamilyTrackingStatus(queue.family_id)
    : [];

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Add a show</h1>
      <p className="text-sm text-[color:var(--muted)] mb-6">
        Search TMDB and add it to this queue.
      </p>
      <SearchBox queueId={queueId} trackingStatus={trackingStatus} />
    </div>
  );
}
