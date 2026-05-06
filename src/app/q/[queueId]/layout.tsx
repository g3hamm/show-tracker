import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isQueueMember, getQueuesForUser, getQueueById } from "@/lib/families/queries";
import { QueuePicker } from "@/components/QueuePicker";
import { RefreshButton, SettingsMenu } from "@/components/SettingsMenu";
import { Logo } from "@/components/Logo";

export default async function QueueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const [hasAccess, queue, queues] = await Promise.all([
    isQueueMember(queueId, userId),
    getQueueById(queueId),
    getQueuesForUser(userId),
  ]);
  if (!hasAccess) redirect("/");

  const shareHref = queue?.share_code
    ? `/recommend?q=${queue.share_code}`
    : undefined;

  return (
    <main className="min-h-screen">
      <header className="bg-[#C01900] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1>
                <Link href={`/q/${queueId}`}>
                  <Logo />
                </Link>
              </h1>
              <QueuePicker queues={queues} currentQueueId={queueId} />
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={`/q/${queueId}/search`}
                className="px-4 py-2 rounded bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors"
              >
                + Add show
              </Link>
              <Link
                href={`/q/${queueId}/discover`}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Discover
              </Link>
              <Link
                href={`/q/${queueId}/analytics`}
                title="Analytics"
                className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
                </svg>
              </Link>
              <RefreshButton />
              <SettingsMenu shareHref={shareHref} />
            </div>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
