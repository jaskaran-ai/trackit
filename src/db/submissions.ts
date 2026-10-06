import { createId } from "@paralleldrive/cuid2";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { db } from "./index";
import { attachment, submission, user } from "./schema";
import type { Priority, SubmissionStatus, SubmissionType } from "./types";

const submissionWithUserAndAttachments = {
  user: {
    columns: { id: true, name: true, email: true, image: true },
  },
  attachments: true,
} as const;

export type SubmissionFilters = {
  userId?: string;
  type?: SubmissionType;
  status?: SubmissionStatus;
  priority?: Priority;
};

function buildSubmissionWhere(filters: SubmissionFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.userId) conditions.push(eq(submission.userId, filters.userId));
  if (filters.type) conditions.push(eq(submission.type, filters.type));
  if (filters.status) conditions.push(eq(submission.status, filters.status));
  if (filters.priority) conditions.push(eq(submission.priority, filters.priority));
  if (conditions.length === 0) return undefined;
  return and(...conditions);
}

export async function listSubmissions(filters: SubmissionFilters = {}) {
  return db.query.submission.findMany({
    where: buildSubmissionWhere(filters),
    with: submissionWithUserAndAttachments,
    orderBy: desc(submission.createdAt),
  });
}

export async function getSubmissionById(id: string) {
  return db.query.submission.findFirst({
    where: eq(submission.id, id),
    with: submissionWithUserAndAttachments,
  });
}

export async function countSubmissions(
  filters: Pick<SubmissionFilters, "status" | "type"> = {},
) {
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(submission.status, filters.status));
  if (filters.type) conditions.push(eq(submission.type, filters.type));

  const [row] = await db
    .select({ value: count() })
    .from(submission)
    .where(conditions.length ? and(...conditions) : undefined);

  return row?.value ?? 0;
}

export async function countUsers() {
  const [row] = await db.select({ value: count() }).from(user);
  return row?.value ?? 0;
}

export async function createSubmission(input: {
  type: SubmissionType;
  title: string;
  description: string;
  priority?: Priority;
  project?: (typeof submission.$inferInsert)["project"];
  userId: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}) {
  const submissionId = createId();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(submission).values({
      id: submissionId,
      type: input.type,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      project: input.project ?? "OTHER",
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    });

    if (input.attachments?.length) {
      await tx.insert(attachment).values(
        input.attachments.map((a) => ({
          id: createId(),
          submissionId,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          createdAt: now,
        })),
      );
    }
  });

  return getSubmissionById(submissionId);
}

export async function updateSubmission(
  id: string,
  data: { status?: SubmissionStatus; priority?: Priority },
) {
  await db
    .update(submission)
    .set({
      ...(data.status ? { status: data.status } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      updatedAt: new Date(),
    })
    .where(eq(submission.id, id));

  return getSubmissionById(id);
}

export async function deleteSubmission(id: string) {
  return db.delete(submission).where(eq(submission.id, id));
}

export async function listAttachmentsForSubmission(submissionId: string) {
  return db.query.attachment.findMany({
    where: eq(attachment.submissionId, submissionId),
  });
}
