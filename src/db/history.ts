import { createId } from "@paralleldrive/cuid2";
import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { submissionHistory } from "./schema";

import type { HistoryField } from "./types";

export type { HistoryField };

export async function logHistory(entry: {
  submissionId: string;
  changedById?: string | null;
  field: HistoryField | string;
  fromValue?: string | null;
  toValue?: string | null;
}) {
  return db
    .insert(submissionHistory)
    .values({
      id: createId(),
      submissionId: entry.submissionId,
      changedById: entry.changedById ?? null,
      field: entry.field,
      fromValue: entry.fromValue ?? null,
      toValue: entry.toValue ?? null,
    })
    .returning();
}

/** Fields whose before/after values we diff for the audit trail. */
type TrackedField = "status" | "priority" | "dueDate";

/** Logs every tracked field that actually changed, skipping no-op writes. */
export async function logFieldChanges(
  submissionId: string,
  changedById: string | null,
  before: Partial<Record<TrackedField, string | Date | null | undefined>>,
  after: Partial<Record<TrackedField, string | Date | null | undefined>>,
) {
  const fields: TrackedField[] = ["status", "priority", "dueDate"];

  await Promise.all(
    fields
      .filter((field) => normalise(before[field]) !== normalise(after[field]))
      .map((field) =>
        logHistory({
          submissionId,
          changedById,
          field,
          fromValue: serialise(before[field]),
          toValue: serialise(after[field]),
        }),
      ),
  );
}

function normalise(value: string | Date | null | undefined) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();
  return String(value);
}

function serialise(value: string | Date | null | undefined) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function listHistory(submissionId: string) {
  return db.query.submissionHistory.findMany({
    where: eq(submissionHistory.submissionId, submissionId),
    with: {
      changedBy: {
        columns: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [desc(submissionHistory.createdAt)],
  });
}
