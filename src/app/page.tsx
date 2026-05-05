import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getDefaultQueueForUser } from "@/lib/families/queries";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const defaultQueue = await getDefaultQueueForUser(userId);
  if (!defaultQueue) redirect("/family/setup");

  redirect(`/q/${defaultQueue.id}`);
}
