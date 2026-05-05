import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isQueueMember, getQueuesForUser } from "@/lib/families/queries";
import { QueuePicker } from "@/components/QueuePicker";
import { SignOutButton } from "@/components/SignOutButton";
import { RefreshNowButton } from "@/components/RefreshNowButton";
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

  const hasAccess = await isQueueMember(queueId, userId);
  if (!hasAccess) redirect("/");

  const queues = await getQueuesForUser(userId);

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
            <SignOutButton />
          </div>
          <nav className="flex items-center gap-3 text-sm mt-3">
            <Link
              href={`/q/${queueId}/search`}
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
      {children}
    </main>
  );
}
