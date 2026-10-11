import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { submissionHistory } from "./schema";

import type { HistoryField } from "./types";

export type { HistoryField };

/**
 * Position of the last row a page returned. `ts` keeps microseconds as text;
 * a JS Date would drop them and could skip rows that share a millisecond.
 */
export type HistoryCursor = { ts: string; id: string };

const CURSOR_TS_FORMAT = 'YYYY-MM-DD"T"HH24:MI:SS.US';
const CURSOR_TS_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/;

export function encodeHistoryCursor(cursor: HistoryCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

/** Returns null for anything that isn't a cursor this module issued. */
export function decodeHistoryCursor(raw: string): HistoryCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<HistoryCursor>;
    if (typeof parsed.id === "string" && typeof parsed.ts === "string" && CURSOR_TS_PATTERN.test(parsed.ts)) {
      return { ts: parsed.ts, id: parsed.id };
    }
  } catch {
    // Fall through to null: the caller rejects the request.
  }
  return null;
}

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

/**
 * One page of history, newest first. Fetches one extra row to learn whether a
 * next page exists, and returns the cursor of the last row shown.
 */
export async function listHistoryPage(
  submissionId: string,
  { limit, after }: { limit: number; after: HistoryCursor | null },
) {
  const rows = await db.query.submissionHistory.findMany({
    where: and(
      eq(submissionHistory.submissionId, submissionId),
      after
        ? sql`(${submissionHistory.createdAt}, ${submissionHistory.id}) < (${after.ts}::timestamp, ${after.id})`
        : undefined,
    ),
    with: {
      changedBy: {
        columns: { id: true, name: true, email: true, image: true },
      },
    },
    extras: {
      cursorTs: sql<string>`to_char(${submissionHistory.createdAt}, ${CURSOR_TS_FORMAT})`.as("cursorTs"),
    },
    orderBy: [desc(submissionHistory.createdAt), desc(submissionHistory.id)],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page.at(-1);

  return {
    items: page.map(({ cursorTs: _cursorTs, ...entry }) => entry),
    nextCursor: hasMore && last ? encodeHistoryCursor({ ts: last.cursorTs, id: last.id }) : null,
  };
}
