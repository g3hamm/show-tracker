import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getDefaultQueueForUser } from "@/lib/families/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShowRedirectPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const defaultQueue = await getDefaultQueueForUser(userId);
  if (!defaultQueue) redirect("/family/setup");

  redirect(`/q/${defaultQueue.id}/show/${id}`);
}
