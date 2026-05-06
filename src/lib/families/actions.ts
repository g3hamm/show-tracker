"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getTurso } from "@/lib/turso/client";
import type { InStatement } from "@libsql/client";
import { getFamilyByUserId, isQueueMember, getQueueById } from "./queries";
import type { FamilySubscription } from "./types";

function generateShareCode(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) code += chars[b % chars.length];
  return code;
}

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function ensureUser(userId: string) {
  const user = await currentUser();
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.emailAddresses?.[0]?.emailAddress ?? userId;
  await getTurso().execute({
    sql: `INSERT INTO users (id, display_name) VALUES (?, ?)
          ON CONFLICT (id) DO UPDATE SET display_name = excluded.display_name`,
    args: [userId, displayName],
  });
}

export async function createFamily(name: string): Promise<string> {
  const userId = await requireUser();
  await ensureUser(userId);

  const existing = await getFamilyByUserId(userId);
  if (existing) throw new Error("Already in a family");

  const familyId = crypto.randomUUID();
  const soloQueueId = crypto.randomUUID();
  const db = getTurso();

  await db.batch([
    {
      sql: "INSERT INTO families (id, name, created_by) VALUES (?, ?, ?)",
      args: [familyId, name.trim(), userId],
    },
    {
      sql: "INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'admin')",
      args: [familyId, userId],
    },
    {
      sql: "INSERT INTO queues (id, family_id, name, type, owner_id, share_code) VALUES (?, ?, 'My Queue', 'solo', ?, ?)",
      args: [soloQueueId, familyId, userId, generateShareCode()],
    },
  ]);

  revalidatePath("/");
  return familyId;
}

export async function createGroupQueue(
  familyId: string,
  name: string,
  memberIds: string[],
): Promise<string> {
  const userId = await requireUser();

  const family = await getFamilyByUserId(userId);
  if (!family || family.id !== familyId) throw new Error("Not in this family");

  const queueId = crypto.randomUUID();
  const db = getTurso();

  const statements: InStatement[] = [
    {
      sql: "INSERT INTO queues (id, family_id, name, type, share_code) VALUES (?, ?, ?, 'group', ?)",
      args: [queueId, familyId, name.trim(), generateShareCode()],
    },
  ];

  for (const memberId of memberIds) {
    statements.push({
      sql: "INSERT INTO queue_members (queue_id, user_id) VALUES (?, ?)",
      args: [queueId, memberId],
    });
  }

  await db.batch(statements);
  revalidatePath("/family");
  return queueId;
}

export async function updateGroupQueue(
  queueId: string,
  name: string,
  memberIds: string[],
): Promise<void> {
  const userId = await requireUser();

  const queue = await getQueueById(queueId);
  if (!queue || queue.type !== "group") throw new Error("Invalid queue");

  const family = await getFamilyByUserId(userId);
  if (!family || family.id !== queue.family_id) throw new Error("Not authorized");

  const db = getTurso();

  const statements: InStatement[] = [
    { sql: "UPDATE queues SET name = ? WHERE id = ?", args: [name.trim(), queueId] },
    { sql: "DELETE FROM queue_members WHERE queue_id = ?", args: [queueId] },
  ];

  for (const memberId of memberIds) {
    statements.push({
      sql: "INSERT INTO queue_members (queue_id, user_id) VALUES (?, ?)",
      args: [queueId, memberId],
    });
  }

  await db.batch(statements);
  revalidatePath("/family");
}

export async function deleteGroupQueue(queueId: string): Promise<void> {
  const userId = await requireUser();

  const queue = await getQueueById(queueId);
  if (!queue || queue.type !== "group") throw new Error("Cannot delete this queue");

  const family = await getFamilyByUserId(userId);
  if (!family || family.id !== queue.family_id) throw new Error("Not authorized");

  await getTurso().execute({ sql: "DELETE FROM queues WHERE id = ?", args: [queueId] });
  revalidatePath("/family");
}

export async function createInvite(familyId: string): Promise<string> {
  const userId = await requireUser();

  const family = await getFamilyByUserId(userId);
  if (!family || family.id !== familyId) throw new Error("Not authorized");

  const id = crypto.randomUUID();
  const code = generateShareCode();

  await getTurso().execute({
    sql: "INSERT INTO family_invites (id, family_id, invite_code, created_by) VALUES (?, ?, ?, ?)",
    args: [id, familyId, code, userId],
  });

  return code;
}

export async function acceptInvite(code: string): Promise<string> {
  const userId = await requireUser();
  await ensureUser(userId);

  const existing = await getFamilyByUserId(userId);
  if (existing) throw new Error("Already in a family");

  const db = getTurso();

  const inviteResult = await db.execute({
    sql: `SELECT fi.*, f.name as family_name FROM family_invites fi
          JOIN families f ON fi.family_id = f.id
          WHERE fi.invite_code = ? AND fi.used_by IS NULL`,
    args: [code],
  });

  if (inviteResult.rows.length === 0) throw new Error("Invalid or used invite code");

  const invite = inviteResult.rows[0];
  const familyId = invite.family_id as string;
  const soloQueueId = crypto.randomUUID();

  await db.batch([
    {
      sql: "UPDATE family_invites SET used_by = ?, used_at = datetime('now') WHERE id = ?",
      args: [userId, invite.id as string],
    },
    {
      sql: "INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'member')",
      args: [familyId, userId],
    },
    {
      sql: "INSERT INTO queues (id, family_id, name, type, owner_id, share_code) VALUES (?, ?, 'My Queue', 'solo', ?, ?)",
      args: [soloQueueId, familyId, userId, generateShareCode()],
    },
  ]);

  revalidatePath("/");
  return familyId;
}

export async function removeFamilyMember(familyId: string, targetUserId: string): Promise<void> {
  const userId = await requireUser();

  const family = await getFamilyByUserId(userId);
  if (!family || family.id !== familyId) throw new Error("Not authorized");

  const adminCheck = await getTurso().execute({
    sql: "SELECT role FROM family_members WHERE family_id = ? AND user_id = ?",
    args: [familyId, userId],
  });
  if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
    throw new Error("Only admin can remove members");
  }

  if (targetUserId === userId) throw new Error("Cannot remove yourself");

  const db = getTurso();
  await db.batch([
    { sql: "DELETE FROM queue_members WHERE user_id = ? AND queue_id IN (SELECT id FROM queues WHERE family_id = ?)", args: [targetUserId, familyId] },
    { sql: "DELETE FROM queue_shows WHERE added_by = ? AND queue_id IN (SELECT id FROM queues WHERE family_id = ? AND type = 'solo' AND owner_id = ?)", args: [targetUserId, familyId, targetUserId] },
    { sql: "DELETE FROM queues WHERE family_id = ? AND type = 'solo' AND owner_id = ?", args: [familyId, targetUserId] },
    { sql: "DELETE FROM family_members WHERE family_id = ? AND user_id = ?", args: [familyId, targetUserId] },
  ]);

  revalidatePath("/family");
}

export async function updateFamilySubscriptions(
  familyId: string,
  providers: Omit<FamilySubscription, "family_id">[],
): Promise<void> {
  const userId = await requireUser();

  const family = await getFamilyByUserId(userId);
  if (!family || family.id !== familyId) throw new Error("Not authorized");

  const db = getTurso();

  // Preserve existing monthly costs so editing subscriptions doesn't wipe them.
  const existingResult = await db.execute({
    sql: "SELECT provider_id, monthly_cost FROM family_subscriptions WHERE family_id = ?",
    args: [familyId],
  });
  const costMap = new Map<number, number | null>(
    existingResult.rows.map((r) => [r.provider_id as number, (r.monthly_cost as number | null) ?? null]),
  );

  const statements: InStatement[] = [
    { sql: "DELETE FROM family_subscriptions WHERE family_id = ?", args: [familyId] },
  ];

  for (const p of providers) {
    statements.push({
      sql: "INSERT INTO family_subscriptions (family_id, provider_id, provider_name, logo_path, monthly_cost) VALUES (?, ?, ?, ?, ?)",
      args: [familyId, p.provider_id, p.provider_name, p.logo_path, costMap.get(p.provider_id) ?? null],
    });
  }

  await db.batch(statements);
  revalidatePath("/family");
}

export async function updateProviderMonthlyCost(
  providerId: number,
  cost: number | null,
): Promise<void> {
  const userId = await requireUser();
  const family = await getFamilyByUserId(userId);
  if (!family) throw new Error("Not in a family");

  await getTurso().execute({
    sql: "UPDATE family_subscriptions SET monthly_cost = ? WHERE family_id = ? AND provider_id = ?",
    args: [cost, family.id, providerId],
  });
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const userId = await requireUser();
  await getTurso().execute({
    sql: "UPDATE users SET display_name = ? WHERE id = ?",
    args: [displayName.trim(), userId],
  });
  revalidatePath("/family");
}

export async function requireQueueAccess(queueId: string): Promise<string> {
  const userId = await requireUser();
  const hasAccess = await isQueueMember(queueId, userId);
  if (!hasAccess) throw new Error("Not authorized for this queue");
  return userId;
}
