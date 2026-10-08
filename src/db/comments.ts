import { createId } from "@paralleldrive/cuid2";
import { inArray, sql } from "drizzle-orm";
import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { submissionComment } from "./schema";
import type { SubmissionComment, User } from "./types";

const commentWithUser = {
  user: {
    columns: { id: true, name: true, email: true, image: true },
  },
} as const;

export type CommentWithUser = SubmissionComment & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

export async function listComments(submissionId: string) {
  return db.query.submissionComment.findMany({
    where: eq(submissionComment.submissionId, submissionId),
    with: commentWithUser,
    orderBy: [asc(submissionComment.createdAt)],
  });
}

export async function getCommentById(id: string) {
  return db.query.submissionComment.findFirst({
    where: eq(submissionComment.id, id),
    with: commentWithUser,
  });
}

export async function createComment(input: {
  submissionId: string;
  userId: string;
  body: string;
}) {
  const rows = await db
    .insert(submissionComment)
    .values({
      id: createId(),
      submissionId: input.submissionId,
      userId: input.userId,
      body: input.body,
    })
    .returning();

  const created = rows[0];
  if (!created) return null;
  return getCommentById(created.id);
}

export async function deleteComment(id: string) {
  return db.delete(submissionComment).where(eq(submissionComment.id, id));
}

/** Comment counts for many submissions in one round trip, keyed by submission. */
export async function countCommentsBySubmission(submissionIds: string[]) {
  if (submissionIds.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      submissionId: submissionComment.submissionId,
      value: sql<number>`count(*)::int`,
    })
    .from(submissionComment)
    .where(inArray(submissionComment.submissionId, submissionIds))
    .groupBy(submissionComment.submissionId);

  return new Map(rows.map((row) => [row.submissionId, Number(row.value)]));
}
