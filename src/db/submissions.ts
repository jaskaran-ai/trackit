import { createId } from "@paralleldrive/cuid2";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "./index";
import { attachment, submission, user } from "./schema";
import { logFieldChanges, logHistory } from "./history";
import { createNotification } from "./notifications";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "./types";

const submissionWithUserAndAttachments = {
  user: {
    columns: { id: true, name: true, email: true, image: true },
  },
  attachments: true,
} as const;

export type SubmissionFilters = {
  userId?: string;
  type?: SubmissionType;
  status?: SubmissionStatus | SubmissionStatus[];
  priority?: Priority;
  project?: Project;
  search?: string;
  sort?: SortKey;
  dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
  /** Archived (soft-deleted) submissions are hidden unless this is set. */
  includeDeleted?: boolean;
};

export type SortKey =
  | "createdAt"
  | "updatedAt"
  | "status"
  | "type"
  | "priority"
  | "title"
  | "dueDate";

const PRIORITY_RANK = sql`case "submission"."priority"
  when 'CRITICAL' then 0
  when 'HIGH' then 1
  when 'MEDIUM' then 2
  when 'LOW' then 3
  else 4 end`;

const STATUS_RANK = sql`case "submission"."status"
  when 'OPEN' then 0
  when 'IN_PROGRESS' then 1
  when 'REVIEW' then 2
  when 'COMPLETE' then 3
  when 'CANCELED' then 4
  else 5 end`;

function buildSubmissionWhere(filters: SubmissionFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.userId) conditions.push(eq(submission.userId, filters.userId));
  if (filters.type) conditions.push(eq(submission.type, filters.type));
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(inArray(submission.status, filters.status));
    } else {
      conditions.push(eq(submission.status, filters.status));
    }
  }
  if (filters.priority) conditions.push(eq(submission.priority, filters.priority));
  if (filters.project) conditions.push(eq(submission.project, filters.project));
  if (filters.search?.trim()) {
    conditions.push(ilike(submission.title, `%${filters.search.trim()}%`));
  }

  // Soft delete is a filter, not a delete — archived rows stay queryable
  // explicitly so admins can restore them.
  if (!filters.includeDeleted) {
    conditions.push(sql`${submission.deletedAt} is null`);
  }

  if (conditions.length === 0) return undefined;
  return and(...conditions);
}

function buildSubmissionOrderBy(filters: SubmissionFilters): SQL[] {
  const dir = filters.dir === "asc" ? asc : desc;

  switch (filters.sort) {
    case "status":
      return [asc(STATUS_RANK), desc(submission.createdAt)];
    case "priority":
      return [asc(PRIORITY_RANK), desc(submission.createdAt)];
    case "type":
      return [dir(submission.type), desc(submission.createdAt)];
    case "title":
      return [dir(submission.title)];
    case "dueDate":
      // Nulls last in both directions — no due date means "not tracked"
      return [
        sql`${submission.dueDate} is null`,
        dir(submission.dueDate),
        desc(submission.createdAt),
      ];
    case "updatedAt":
      return [dir(submission.updatedAt)];
    case "createdAt":
    default:
      return [dir(submission.createdAt)];
  }
}

export async function listSubmissions(filters: SubmissionFilters = {}) {
  return db.query.submission.findMany({
    where: buildSubmissionWhere(filters),
    with: submissionWithUserAndAttachments,
    orderBy: buildSubmissionOrderBy(filters),
    ...(filters.limit ? { limit: filters.limit } : {}),
    ...(filters.offset ? { offset: filters.offset } : {}),
  });
}

export async function getSubmissionById(id: string) {
  return db.query.submission.findFirst({
    where: eq(submission.id, id),
    with: submissionWithUserAndAttachments,
  });
}

/** Ignores soft-delete scope — used by the restore flow. */
export async function getSubmissionByIdIncludingDeleted(id: string) {
  return db.query.submission.findFirst({
    where: eq(submission.id, id),
    with: submissionWithUserAndAttachments,
    columns: {
      id: true,
      userId: true,
      title: true,
      type: true,
      status: true,
      priority: true,
      project: true,
      dueDate: true,
      resolvedAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function countSubmissions(filters: SubmissionFilters = {}) {
  const [row] = await db
    .select({ value: count() })
    .from(submission)
    .where(buildSubmissionWhere(filters));

  return row?.value ?? 0;
}

export async function countUsers() {
  const [row] = await db.select({ value: count() }).from(user);
  return row?.value ?? 0;
}

const RESOLVED_STATUSES: SubmissionStatus[] = ["COMPLETE", "CANCELED"];

export async function createSubmission(input: {
  type: SubmissionType;
  title: string;
  description: string;
  priority?: Priority;
  project?: (typeof submission.$inferInsert)["project"];
  dueDate?: Date | null;
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
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
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

  await logHistory({
    submissionId,
    changedById: input.userId,
    field: "created",
    fromValue: null,
    toValue: "OPEN",
  });

  return getSubmissionById(submissionId);
}

/**
 * Applies a status/priority/dueDate change and keeps the audit trail and the
 * owner's notifications in sync in the same call, so no caller can forget.
 */
export async function updateSubmission(
  id: string,
  data: { status?: SubmissionStatus; priority?: Priority; dueDate?: Date | null },
  actorId?: string,
) {
  const before = await db.query.submission.findFirst({
    where: eq(submission.id, id),
  });
  if (!before) return null;

  const patch: Partial<typeof submission.$inferInsert> = {};

  if (data.status && data.status !== before.status) patch.status = data.status;
  if (data.priority && data.priority !== before.priority) {
    patch.priority = data.priority;
  }
  if (data.dueDate !== undefined) {
    patch.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  // resolvedAt is derived, never set directly by callers.
  if (patch.status) {
    const isNowResolved = RESOLVED_STATUSES.includes(patch.status);
    const wasResolved = RESOLVED_STATUSES.includes(before.status);
    if (isNowResolved && !wasResolved) patch.resolvedAt = new Date();
    if (!isNowResolved && wasResolved) patch.resolvedAt = null;
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date();

    await db.update(submission).set(patch).where(eq(submission.id, id));

    await logFieldChanges(
      id,
      actorId ?? null,
      {
        status: before.status,
        priority: before.priority,
        dueDate: before.dueDate,
      },
      {
        status: patch.status ?? before.status,
        priority: patch.priority ?? before.priority,
        dueDate: patch.dueDate !== undefined ? patch.dueDate : before.dueDate,
      },
    );

    // Tell the owner what happened — unless they did it themselves.
    if (actorId && actorId !== before.userId) {
      const parts: string[] = [];
      if (patch.status) parts.push(`status → ${patch.status}`);
      if (patch.priority) parts.push(`priority → ${patch.priority}`);
      if (patch.dueDate !== undefined) parts.push("due date updated");

      if (parts.length > 0) {
        await createNotification({
          userId: before.userId,
          submissionId: id,
          type: "submission_updated",
          title: before.title,
          body: parts.join(", "),
        });
      }
    }
  }

  return getSubmissionById(id);
}

/** Soft delete — the row and its files stay put until a hard delete. */
export async function archiveSubmission(id: string, actorId?: string) {
  const [row] = await db
    .update(submission)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(submission.id, id), sql`${submission.deletedAt} is null`))
    .returning();

  if (row) {
    await logHistory({
      submissionId: id,
      changedById: actorId ?? null,
      field: "archived",
      fromValue: null,
      toValue: row.title,
    });
  }

  return row ?? null;
}

export async function restoreSubmission(id: string, actorId?: string) {
  const [row] = await db
    .update(submission)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(submission.id, id))
    .returning();

  if (row) {
    await logHistory({
      submissionId: id,
      changedById: actorId ?? null,
      field: "restored",
      fromValue: null,
      toValue: row.title,
    });
  }

  return row ?? null;
}

/** Permanent delete — also removes the attachment files, best effort. */
export async function hardDeleteSubmission(id: string) {
  const rows = await db
    .delete(submission)
    .where(eq(submission.id, id))
    .returning();

  return rows.length > 0;
}

export async function listAttachmentsForSubmission(submissionId: string) {
  return db.query.attachment.findMany({
    where: eq(attachment.submissionId, submissionId),
  });
}

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

export type SubmissionStats = {
  total: number;
  open: number;
  inProgress: number;
  review: number;
  complete: number;
  canceled: number;
  bugs: number;
  features: number;
  users: number;
  archived: number;
  overdue: number;
  avgResolutionHours: number | null;
  byProject: Array<{ project: Project; total: number; open: number }>;
  trend: Array<{ date: string; created: number; resolved: number }>;
};

export async function getSubmissionStats(days = 30): Promise<SubmissionStats> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const live = sql`${submission.deletedAt} is null`;

  const [byStatus, byType, byProject, totals, overdue, resolved, trend] =
    await Promise.all([
      db
        .select({ status: submission.status, value: count() })
        .from(submission)
        .where(live)
        .groupBy(submission.status),
      db
        .select({ type: submission.type, value: count() })
        .from(submission)
        .where(live)
        .groupBy(submission.type),
      db
        .select({
          project: submission.project,
          total: sql<number>`count(*)::int`,
          open: sql<number>`count(*) filter (where "submission"."status" = 'OPEN')::int`,
        })
        .from(submission)
        .where(live)
        .groupBy(submission.project),
      db
        .select({ value: count() })
        .from(submission)
        .where(live),
      db
        .select({ value: count() })
        .from(submission)
        .where(
          and(
            live,
            sql`${submission.dueDate} is not null`,
            sql`${submission.dueDate} < now()`,
            notInArray(submission.status, RESOLVED_STATUSES),
          ),
        ),
      db
        .select({
          hours: sql<number>`avg(extract(epoch from ("submission"."resolvedAt" - "submission"."createdAt")) / 3600)`,
        })
        .from(submission)
        .where(and(live, sql`${submission.resolvedAt} is not null`)),
      getTrendRows(since),
    ]);

  const [archived] = await db
    .select({ value: count() })
    .from(submission)
    .where(sql`${submission.deletedAt} is not null`);

  const statusCount = (status: SubmissionStatus) =>
    Number(byStatus.find((row) => row.status === status)?.value ?? 0);
  const typeCount = (type: SubmissionType) =>
    Number(byType.find((row) => row.type === type)?.value ?? 0);

  return {
    total: Number(totals[0]?.value ?? 0),
    open: statusCount("OPEN"),
    inProgress: statusCount("IN_PROGRESS"),
    review: statusCount("REVIEW"),
    complete: statusCount("COMPLETE"),
    canceled: statusCount("CANCELED"),
    bugs: typeCount("BUG"),
    features: typeCount("FEATURE"),
    users: await countUsers(),
    archived: Number(archived?.value ?? 0),
    overdue: Number(overdue[0]?.value ?? 0),
    avgResolutionHours:
      resolved[0]?.hours === null || resolved[0]?.hours === undefined
        ? null
        : Math.round(Number(resolved[0].hours) * 10) / 10,
    byProject: byProject.map((row) => ({
      project: row.project,
      total: Number(row.total),
      open: Number(row.open),
    })),
    trend,
  };
}

/** Daily created/resolved counts, with empty days filled in for the chart. */
async function getTrendRows(since: Date) {
  const rows = await db.execute<{
    date: string;
    created: number;
    resolved: number;
  }>(sql`
    select
      to_char(date_trunc('day', d.day), 'YYYY-MM-DD') as date,
      count(*) filter (where d.kind = 'created')::int as created,
      count(*) filter (where d.kind = 'resolved')::int as resolved
    from (
      select "createdAt" as day, 'created' as kind
        from "submission"
        where "deletedAt" is null and "createdAt" >= ${since}
      union all
      select "resolvedAt" as day, 'resolved' as kind
        from "submission"
        where "deletedAt" is null and "resolvedAt" is not null and "resolvedAt" >= ${since}
    ) d
    group by 1
    order by 1
  `);

  const byDate = new Map(rows.rows.map((row) => [row.date, row]));
  const trend: SubmissionStats["trend"] = [];

  for (let i = 0; i < 30; i += 1) {
    const day = new Date(since);
    day.setDate(since.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const row = byDate.get(key);
    trend.push({
      date: key,
      created: Number(row?.created ?? 0),
      resolved: Number(row?.resolved ?? 0),
    });
  }

  return trend;
}
