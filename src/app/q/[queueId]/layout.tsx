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
    : "/recommend";

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
