import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import {
  archiveSubmission,
  bulkArchiveSubmissions,
  bulkHardDeleteSubmissions,
  bulkRestoreSubmissions,
  bulkUpdateSubmissions,
  countSubmissions,
  createSubmission,
  DEFAULT_LIST_LIMIT,
  getSubmissionById,
  hardDeleteSubmission,
  listAttachmentsForSubmission,
  listAttachmentsForSubmissions,
  listSubmissions,
  restoreSubmission,
  updateSubmission,
} from "@/db/submissions";
import { countVotesBySubmission, listVotedSubmissionIds } from "@/db/votes";
import type { Priority, SubmissionStatus } from "@/db/types";
import {
  PRIORITIES,
  PROJECTS,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
} from "@/db/types";
import { badRequest, forbidden, notFound, protectedProcedure } from "@/orpc/context";

const SORT_KEYS = [
  "createdAt",
  "updatedAt",
  "status",
  "type",
  "priority",
  "title",
  "dueDate",
] as const;

export const MAX_BULK = 200;
export const BULK_ACTIONS = ["status", "priority", "archive", "restore", "delete"] as const;

/**
 * `limit` / `offset` are coerced because the REST handler fed them straight
 * from `searchParams` strings. `dir` defaults to `"desc"` for the same reason.
 */
const submissionFiltersSchema = z.object({
  type: z.enum(SUBMISSION_TYPES).optional(),
  status: z.enum(SUBMISSION_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  project: z.enum(PROJECTS).optional(),
  search: z.string().optional(),
  sort: z.enum(SORT_KEYS).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
  includeDeleted: z.boolean().optional(),
});

const attachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
});

/** Best-effort unlink of stored attachment files under /public. */
async function unlinkAttachmentFiles(
  attachments: Array<{ fileUrl: string }>,
) {
  for (const attachment of attachments) {
    try {
      await fs.unlink(path.join(process.cwd(), "public", attachment.fileUrl));
    } catch {
      // ignore missing files
    }
  }
}

export const submissionsRouter = {
  list: protectedProcedure
    .route({ method: "GET", path: "/submissions" })
    .input(submissionFiltersSchema)
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const isAdmin = user.role === "admin";
      // Archived rows are only ever visible to admins, and only when asked for.
      const withDeleted = isAdmin && input.includeDeleted === true;

      // Non-admins can never opt into archived rows, and only see their own.
      const shared = {
        ...(isAdmin ? {} : { userId: user.id }),
        ...(withDeleted ? { includeDeleted: true } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.project ? { project: input.project } : {}),
        ...(input.search ? { search: input.search } : {}),
      };

      // Admins load the full lean board (client-side filters). Users stay capped.
      const hasLimit =
        input.limit !== undefined && Number.isFinite(input.limit) && input.limit > 0;
      const limit = hasLimit
        ? input.limit
        : isAdmin
          ? undefined
          : DEFAULT_LIST_LIMIT;
      const offset =
        input.offset !== undefined && Number.isFinite(input.offset) && input.offset > 0
          ? input.offset
          : undefined;

      const [submissions, total] = await Promise.all([
        listSubmissions({
          ...shared,
          lean: true,
          ...(input.sort ? { sort: input.sort, dir: input.dir } : {}),
          ...(limit !== undefined ? { limit } : { unlimited: true }),
          ...(offset ? { offset } : {}),
        }),
        countSubmissions(shared),
      ]);

      return { submissions, total };
    }),

  create: protectedProcedure
    .route({ method: "POST", path: "/submissions", successStatus: 201 })
    .input(
      z.object({
        type: z.enum(SUBMISSION_TYPES),
        title: z.string(),
        description: z.string(),
        priority: z.enum(PRIORITIES).optional(),
        project: z.enum(PROJECTS).optional(),
        dueDate: z.coerce.date().nullish(),
        attachments: z.array(attachmentSchema).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      // Same user-facing message the REST handler returned for missing fields.
      if (!input.type || !input.title || !input.description) {
        throw badRequest("Missing required fields");
      }

      return createSubmission({
        type: input.type,
        title: input.title.trim(),
        description: input.description,
        priority: input.priority,
        project: input.project,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        userId: context.auth.user.id,
        attachments: input.attachments,
      });
    }),

  get: protectedProcedure
    .route({ method: "GET", path: "/submissions/{id}" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const submission = await getSubmissionById(input.id);
      if (!submission) throw notFound();

      const { user } = context.auth;
      if (user.role !== "admin" && submission.userId !== user.id) {
        throw forbidden();
      }

      return submission;
    }),

  update: protectedProcedure
    .route({ method: "PATCH", path: "/submissions/{id}" })
    .input(
      z.object({
        id: z.string(),
        status: z.enum(SUBMISSION_STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        dueDate: z.coerce.date().nullish(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (context.auth.user.role !== "admin") throw forbidden();

      const submission = await updateSubmission(
        input.id,
        {
          ...(input.status ? { status: input.status } : {}),
          ...(input.priority ? { priority: input.priority } : {}),
          ...(input.dueDate !== undefined
            ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
            : {}),
        },
        context.auth.user.id,
      );

      if (!submission) throw notFound();

      return submission;
    }),

  remove: protectedProcedure
    .route({ method: "DELETE", path: "/submissions/{id}" })
    .input(z.object({ id: z.string(), permanent: z.boolean().optional() }))
    .handler(async ({ input, context }) => {
      if (context.auth.user.role !== "admin") throw forbidden();

      if (input.permanent) {
        // Unlink files first so a failed delete can't orphan stored assets.
        await unlinkAttachmentFiles(await listAttachmentsForSubmission(input.id));
        if (!(await hardDeleteSubmission(input.id))) throw notFound();

        return { success: true, permanent: true };
      }

      const archived = await archiveSubmission(input.id, context.auth.user.id);
      if (!archived) throw notFound();

      return { success: true, permanent: false };
    }),

  /** Restores an archived submission. Admin only. */
  restore: protectedProcedure
    .route({ method: "POST", path: "/submissions/{id}/restore" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (context.auth.user.role !== "admin") throw forbidden();

      const restored = await restoreSubmission(input.id, context.auth.user.id);
      if (!restored) throw notFound();

      return { success: true };
    }),

  /** Applies one admin action to many submissions in a single request. */
  bulk: protectedProcedure
    .route({ method: "POST", path: "/submissions/bulk" })
    .input(
      z.object({
        ids: z.array(z.string()),
        action: z.enum(BULK_ACTIONS),
        value: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (context.auth.user.role !== "admin") throw forbidden();

      if (input.ids.length === 0) throw badRequest("No submissions selected");
      if (input.ids.length > MAX_BULK) {
        throw badRequest(`Select at most ${MAX_BULK} submissions at a time`);
      }
      if ((input.action === "status" || input.action === "priority") && !input.value) {
        throw badRequest("A value is required");
      }

      const actorId = context.auth.user.id;
      let changed = 0;

      switch (input.action) {
        case "status":
          changed = await bulkUpdateSubmissions(
            input.ids,
            { status: input.value as SubmissionStatus },
            actorId,
          );
          break;
        case "priority":
          changed = await bulkUpdateSubmissions(
            input.ids,
            { priority: input.value as Priority },
            actorId,
          );
          break;
        case "archive":
          changed = await bulkArchiveSubmissions(input.ids, actorId);
          break;
        case "restore":
          changed = await bulkRestoreSubmissions(input.ids, actorId);
          break;
        case "delete": {
          const attachments = await listAttachmentsForSubmissions(input.ids);
          await unlinkAttachmentFiles(attachments);
          changed = await bulkHardDeleteSubmissions(input.ids);
          break;
        }
      }

      return { success: true, changed };
    }),

  /**
   * A plain list + count so the archive view can paginate. Kept from the
   * `GET /api/submissions/bulk` handler.
   */
  archived: protectedProcedure
    .route({ method: "GET", path: "/submissions/archived" })
    .input(z.void().optional())
    .handler(async ({ context }) => {
      if (context.auth.user.role !== "admin") throw forbidden();

      const [submissions, total] = await Promise.all([
        listSubmissions({
          includeDeleted: true,
          lean: true,
          unlimited: true,
          sort: "createdAt",
          dir: "desc",
        }),
        countSubmissions({ includeDeleted: true }),
      ]);

      return { submissions, total };
    }),

  /**
   * Rows behind the CSV export. Returns the list only; the export route stays
   * bespoke REST because it has to write `Content-Type: text/csv`.
   */
  exportRows: protectedProcedure
    .route({ method: "GET", path: "/submissions/export" })
    .input(
      z.object({
        status: z.enum(SUBMISSION_STATUSES).optional(),
        type: z.enum(SUBMISSION_TYPES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        project: z.enum(PROJECTS).optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (context.auth.user.role !== "admin") throw forbidden();

      return listSubmissions({
        ...(input.status ? { status: input.status } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.project ? { project: input.project } : {}),
        ...(input.search ? { search: input.search } : {}),
        lean: false,
        unlimited: true,
        sort: "createdAt",
        dir: "desc",
      });
    }),


  /**
   * Dashboard bootstrap: counts + lean board rows + feature vote state in one
   * round trip so the home page does not fan out to count/list/votes.
   */
  summary: protectedProcedure
    .route({ method: "GET", path: "/submissions/summary" })
    .input(z.void().optional())
    .handler(async ({ context }) => {
      const { user } = context.auth;
      const isAdmin = user.role === "admin";
      const scope = isAdmin ? {} : { userId: user.id };

      const [total, open, bugs, features, submissions] = await Promise.all([
        countSubmissions(scope),
        countSubmissions({
          ...scope,
          status: ["OPEN", "IN_PROGRESS", "REVIEW"],
        }),
        countSubmissions({ ...scope, type: "BUG" }),
        countSubmissions({ ...scope, type: "FEATURE" }),
        listSubmissions({ ...scope, lean: true }),
      ]);

      const featureIds = submissions
        .filter((row) => row.type === "FEATURE")
        .map((row) => row.id);

      const [counts, votedIds] = await Promise.all([
        countVotesBySubmission(featureIds),
        listVotedSubmissionIds(featureIds, user.id),
      ]);

      return {
        total,
        open,
        bugs,
        features,
        submissions,
        totalRows: total,
        votes: {
          counts: Object.fromEntries(counts),
          votedIds: Array.from(votedIds),
        },
      };
    }),
  /**
   * Count-only filter for dashboard metrics. Each metric card can fetch its
   * own total in parallel without loading submission rows.
   */
  count: protectedProcedure
    .route({ method: "GET", path: "/submissions/count" })
    .input(
      submissionFiltersSchema.extend({
        status: z
          .union([
            z.enum(SUBMISSION_STATUSES),
            z.array(z.enum(SUBMISSION_STATUSES)),
          ])
          .optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const isAdmin = user.role === "admin";
      const withDeleted = isAdmin && input.includeDeleted === true;

      const total = await countSubmissions({
        ...(isAdmin ? {} : { userId: user.id }),
        ...(withDeleted ? { includeDeleted: true } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.project ? { project: input.project } : {}),
        ...(input.search ? { search: input.search } : {}),
      });

      return { total };
    }),
};
