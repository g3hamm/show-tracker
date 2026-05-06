import { getTurso } from "@/lib/turso/client";
import type {
  Family,
  FamilyMember,
  FamilyInvite,
  FamilySubscription,
  Queue,
  QueueMember,
} from "./types";

export async function getFamilyByUserId(userId: string): Promise<Family | null> {
  const result = await getTurso().execute({
    sql: `SELECT f.* FROM families f
          JOIN family_members fm ON f.id = fm.family_id
          WHERE fm.user_id = ?
          LIMIT 1`,
    args: [userId],
  });
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id as string,
    name: r.name as string,
    created_by: r.created_by as string,
    created_at: r.created_at as string,
  };
}

export async function getFamilyById(familyId: string): Promise<Family | null> {
  const result = await getTurso().execute({
    sql: "SELECT * FROM families WHERE id = ?",
    args: [familyId],
  });
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id as string,
    name: r.name as string,
    created_by: r.created_by as string,
    created_at: r.created_at as string,
  };
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const result = await getTurso().execute({
    sql: `SELECT fm.*, u.display_name FROM family_members fm
          JOIN users u ON fm.user_id = u.id
          WHERE fm.family_id = ?
          ORDER BY fm.role ASC, u.display_name ASC`,
    args: [familyId],
  });
  return result.rows.map((r) => ({
    family_id: r.family_id as string,
    user_id: r.user_id as string,
    role: r.role as "admin" | "member",
    display_name: (r.display_name as string) ?? null,
    joined_at: r.joined_at as string,
  }));
}

export async function getQueuesForUser(userId: string): Promise<Queue[]> {
  const result = await getTurso().execute({
    sql: `SELECT DISTINCT q.* FROM queues q
          LEFT JOIN queue_members qm ON q.id = qm.queue_id
          WHERE q.owner_id = ? OR qm.user_id = ?
          ORDER BY q.type ASC, q.name ASC`,
    args: [userId, userId],
  });
  return result.rows.map(mapQueue);
}

export async function getQueueById(queueId: string): Promise<Queue | null> {
  const result = await getTurso().execute({
    sql: "SELECT * FROM queues WHERE id = ?",
    args: [queueId],
  });
  if (result.rows.length === 0) return null;
  return mapQueue(result.rows[0]);
}

export async function getQueueByShareCode(shareCode: string): Promise<Queue | null> {
  const result = await getTurso().execute({
    sql: "SELECT * FROM queues WHERE share_code = ?",
    args: [shareCode],
  });
  if (result.rows.length === 0) return null;
  return mapQueue(result.rows[0]);
}

export async function getUserSoloQueue(familyId: string, userId: string): Promise<Queue | null> {
  const result = await getTurso().execute({
    sql: "SELECT * FROM queues WHERE family_id = ? AND type = 'solo' AND owner_id = ?",
    args: [familyId, userId],
  });
  if (result.rows.length === 0) return null;
  return mapQueue(result.rows[0]);
}

export async function getDefaultQueueForUser(userId: string): Promise<Queue | null> {
  const family = await getFamilyByUserId(userId);
  if (!family) return null;
  const queues = await getQueuesForUser(userId);
  // Prefer first group queue, fall back to solo
  return queues.find((q) => q.type === "group") ?? queues[0] ?? null;
}

export async function getQueueMembers(queueId: string): Promise<QueueMember[]> {
  const result = await getTurso().execute({
    sql: `SELECT qm.queue_id, qm.user_id, u.display_name
          FROM queue_members qm
          JOIN users u ON qm.user_id = u.id
          WHERE qm.queue_id = ?
          ORDER BY u.display_name ASC`,
    args: [queueId],
  });
  return result.rows.map((r) => ({
    queue_id: r.queue_id as string,
    user_id: r.user_id as string,
    display_name: (r.display_name as string) ?? null,
  }));
}

export async function isQueueMember(queueId: string, userId: string): Promise<boolean> {
  const queue = await getQueueById(queueId);
  if (!queue) return false;
  if (queue.type === "solo") return queue.owner_id === userId;
  const result = await getTurso().execute({
    sql: "SELECT 1 FROM queue_members WHERE queue_id = ? AND user_id = ? LIMIT 1",
    args: [queueId, userId],
  });
  return result.rows.length > 0;
}

export async function getFamilySubscriptions(familyId: string): Promise<FamilySubscription[]> {
  const result = await getTurso().execute({
    sql: "SELECT * FROM family_subscriptions WHERE family_id = ? ORDER BY provider_name ASC",
    args: [familyId],
  });
  return result.rows.map((r) => ({
    family_id: r.family_id as string,
    provider_id: r.provider_id as number,
    provider_name: r.provider_name as string,
    logo_path: r.logo_path as string,
  }));
}

export async function getInviteByCode(code: string): Promise<(FamilyInvite & { family_name: string }) | null> {
  const result = await getTurso().execute({
    sql: `SELECT fi.*, f.name as family_name FROM family_invites fi
          JOIN families f ON fi.family_id = f.id
          WHERE fi.invite_code = ? AND fi.used_by IS NULL`,
    args: [code],
  });
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id as string,
    family_id: r.family_id as string,
    invite_code: r.invite_code as string,
    created_by: r.created_by as string,
    expires_at: (r.expires_at as string) ?? null,
    used_by: (r.used_by as string) ?? null,
    used_at: (r.used_at as string) ?? null,
    created_at: r.created_at as string,
    family_name: r.family_name as string,
  };
}

export async function getUniqueProvidersFromShows(): Promise<
  { provider_id: number; provider_name: string; logo_path: string }[]
> {
  const result = await getTurso().execute(
    "SELECT DISTINCT watch_providers FROM shows WHERE watch_providers IS NOT NULL",
  );
  const seen = new Map<number, { provider_id: number; provider_name: string; logo_path: string }>();
  for (const row of result.rows) {
    const providers = JSON.parse(row.watch_providers as string) as {
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }[];
    for (const p of providers) {
      if (!seen.has(p.provider_id)) seen.set(p.provider_id, p);
    }
  }
  return Array.from(seen.values());
}

export async function getGroupQueuesWithMembers(familyId: string): Promise<{
  queues: Queue[];
  membersByQueue: Record<string, QueueMember[]>;
}> {
  const qResult = await getTurso().execute({
    sql: "SELECT * FROM queues WHERE family_id = ? AND type = 'group' ORDER BY name ASC",
    args: [familyId],
  });
  const queues = qResult.rows.map(mapQueue);
  const membersByQueue: Record<string, QueueMember[]> = {};
  for (const q of queues) {
    membersByQueue[q.id] = await getQueueMembers(q.id);
  }
  return { queues, membersByQueue };
}

export async function getRecommendPageInfo(
  shareCode: string,
): Promise<{ displayName: string; queueId: string } | null> {
  const queue = await getQueueByShareCode(shareCode);
  if (!queue) return null;

  if (queue.type === "solo" && queue.owner_id) {
    const result = await getTurso().execute({
      sql: "SELECT display_name FROM users WHERE id = ?",
      args: [queue.owner_id],
    });
    const name = (result.rows[0]?.display_name as string) ?? "them";
    return { displayName: name, queueId: queue.id };
  }

  const family = await getFamilyById(queue.family_id);
  return { displayName: family?.name ?? queue.name, queueId: queue.id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQueue(r: any): Queue {
  return {
    id: r.id as string,
    family_id: r.family_id as string,
    name: r.name as string,
    type: r.type as "solo" | "group",
    owner_id: (r.owner_id as string) ?? null,
    share_code: (r.share_code as string) ?? null,
    created_at: r.created_at as string,
  };
}
