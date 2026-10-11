import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "./index";
import { submissionAssignee, user } from "./schema";

export type SubmissionAssignee = { id: string; name: string; image: string | null };

/** Assignees for many submissions in one round trip, keyed by submission id. */
export async function listAssigneesBySubmission(submissionIds: string[]) {
  const byId = new Map<string, SubmissionAssignee[]>();
  if (submissionIds.length === 0) return byId;

  const rows = await db
    .select({
      submissionId: submissionAssignee.submissionId,
      id: user.id,
      name: user.name,
      image: user.image,
    })
    .from(submissionAssignee)
    .innerJoin(user, eq(user.id, submissionAssignee.userId))
    .where(inArray(submissionAssignee.submissionId, submissionIds))
    .orderBy(user.name);

  for (const { submissionId, ...person } of rows) {
    const list = byId.get(submissionId) ?? [];
    list.push(person);
    byId.set(submissionId, list);
  }
  return byId;
}

/** The ids from `userIds` that don't match a user. Empty when all exist. */
export async function findMissingUserIds(userIds: string[]) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return [];

  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.id, unique));

  const found = new Set(rows.map((row) => row.id));
  return unique.filter((id) => !found.has(id));
}

/**
 * Replaces the whole assignee set for one submission. Removes people not in
 * the list and adds the new ones. The unique index makes re-adding a no-op.
 */
export async function setSubmissionAssignees(submissionId: string, userIds: string[]) {
  const unique = [...new Set(userIds)];

  await db.transaction(async (tx) => {
    await tx
      .delete(submissionAssignee)
      .where(
        and(
          eq(submissionAssignee.submissionId, submissionId),
          unique.length > 0 ? notInArray(submissionAssignee.userId, unique) : undefined,
        ),
      );

    if (unique.length > 0) {
      await tx
        .insert(submissionAssignee)
        .values(unique.map((userId) => ({ id: createId(), submissionId, userId })))
        .onConflictDoNothing();
    }
  });
}
