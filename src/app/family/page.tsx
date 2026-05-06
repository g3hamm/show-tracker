import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  getFamilyByUserId,
  getFamilyMembers,
  getGroupQueuesWithMembers,
} from "@/lib/families/queries";
import { MemberList } from "@/components/family/MemberList";
import { InviteGenerator } from "@/components/family/InviteGenerator";
import { GroupQueueManager } from "@/components/family/GroupQueueManager";
import { DisplayNameEditor } from "@/components/family/DisplayNameEditor";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const family = await getFamilyByUserId(userId);
  if (!family) redirect("/family/setup");

  const [members, { queues: groupQueues, membersByQueue }] =
    await Promise.all([
      getFamilyMembers(family.id),
      getGroupQueuesWithMembers(family.id),
    ]);

  const currentMember = members.find((m) => m.user_id === userId);
  const isAdmin = currentMember?.role === "admin";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.chillflix.app";

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">{family.name}</h1>
      <p className="text-xs text-[color:var(--muted)] mb-8">Family settings</p>

      <Section title="Your display name">
        <DisplayNameEditor currentName={currentMember?.display_name ?? userId} />
      </Section>

      <Section title="Members" subtitle={`${members.length} member${members.length === 1 ? "" : "s"}`}>
        <MemberList
          familyId={family.id}
          members={members}
          currentUserId={userId}
          isAdmin={isAdmin}
        />
        {isAdmin && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] mb-2">
              Invite someone
            </p>
            <InviteGenerator familyId={family.id} siteUrl={siteUrl} />
          </div>
        )}
      </Section>

      <Section title="Groups" subtitle="Each group gets its own dashboard with independent tracking.">
        <GroupQueueManager
          familyId={family.id}
          groupQueues={groupQueues}
          members={members}
          queueMembers={membersByQueue}
        />
      </Section>

    </div>
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
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {subtitle && (
        <p className="text-xs text-[color:var(--muted)] mb-3">{subtitle}</p>
      )}
      {children}
    </section>
  );
}
