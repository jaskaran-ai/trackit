import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import {
  archiveSubmission,
  countSubmissions,
  createSubmission,
  getSubmissionById,
  hardDeleteSubmission,
  listAttachmentsForSubmission,
  listSubmissions,
  restoreSubmission,
  updateSubmission,
} from "@/db/submissions";
import type {
  Priority,
  Project,
  SubmissionStatus,
  SubmissionType,
} from "@/db/types";
import { badRequest, forbidden, notFound, protectedProcedure } from "@/orpc/context";

const SUBMISSION_TYPES: SubmissionType[] = ["BUG", "FEATURE"];
const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETE",
  "CANCELED",
];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const PROJECTS: Project[] = [
  "IVALT_MOBILE",
  "DOCU_ID",
  "ONDEMAND_ID",
  "KEYCLOCK",
  "OTHER",
];
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

/** Removes a submission's stored files, best effort. */
async function unlinkAttachments(submissionId: string) {
  const attachments = await listAttachmentsForSubmission(submissionId);
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

      const limit =
        input.limit !== undefined && Number.isFinite(input.limit) && input.limit > 0
          ? input.limit
          : undefined;
      const offset =
        input.offset !== undefined && Number.isFinite(input.offset) && input.offset > 0
          ? input.offset
          : undefined;

      const submissions = await listSubmissions({
        ...shared,
        ...(input.sort ? { sort: input.sort, dir: input.dir } : {}),
        ...(limit ? { limit } : {}),
        ...(offset ? { offset } : {}),
      });

      // Total is the unpaginated count so clients can render pager controls.
      const total = await countSubmissions(shared);

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
        await unlinkAttachments(input.id);

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

      for (const id of input.ids) {
        switch (input.action) {
          case "status":
            await updateSubmission(
              id,
              { status: input.value as SubmissionStatus },
              actorId,
            );
            break;
          case "priority":
            await updateSubmission(
              id,
              { priority: input.value as Priority },
              actorId,
            );
            break;
          case "archive":
            await archiveSubmission(id, actorId);
            break;
          case "restore":
            await restoreSubmission(id, actorId);
            break;
          case "delete":
            await unlinkAttachments(id);
            await hardDeleteSubmission(id);
            break;
        }
        changed += 1;
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
        listSubmissions({ includeDeleted: true, sort: "createdAt", dir: "desc" }),
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
        sort: "createdAt",
        dir: "desc",
      });
    }),
};
