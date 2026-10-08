import { createId } from "@paralleldrive/cuid2";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { notification, submission } from "./schema";

export async function listNotifications(userId: string, limit = 30) {
  return db.query.notification.findMany({
    where: eq(notification.userId, userId),
    with: {
      submission: { columns: { id: true, title: true, type: true } },
    },
    orderBy: [desc(notification.createdAt)],
    limit,
  });
}

export async function countUnreadNotifications(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(notification)
    .where(
      and(eq(notification.userId, userId), eq(notification.read, false)),
    );

  return row?.value ?? 0;
}

export async function createNotification(input: {
  userId: string;
  submissionId?: string | null;
  type: string;
  title: string;
  body?: string | null;
}) {
  return db
    .insert(notification)
    .values({
      id: createId(),
      userId: input.userId,
      submissionId: input.submissionId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
    })
    .returning();
}

export async function markNotificationRead(id: string, userId: string) {
  const [row] = await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
    .returning();

  return row ?? null;
}

export async function markAllNotificationsRead(userId: string) {
  return db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, userId), eq(notification.read, false)))
    .returning();
}

/**
 * Notifies the owner of a submission that an admin changed something about it.
 * No-ops when the actor is the owner (self-edits don't need a notification).
 */
export async function notifySubmissionOwner(
  submissionId: string,
  actorId: string,
  build: (ownerId: string) => { type: string; title: string; body?: string },
) {
  const [owner] = await db
    .select({ userId: submission.userId, title: submission.title })
    .from(submission)
    .where(eq(submission.id, submissionId));

  if (!owner || owner.userId === actorId) return null;

  const payload = build(owner.userId);
  return createNotification({
    userId: owner.userId,
    submissionId,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
  });
}
