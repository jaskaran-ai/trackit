import { z } from "zod";
import { getSubmissionStats, listSubmissions } from "@/db/submissions";
import { listUsers, updateUserRole } from "@/db/users";
import { createSavedView, deleteSavedView, listSavedViews } from "@/db/views";
import type { Role } from "@/db/types";
import { adminProcedure, badRequest, notFound } from "@/orpc/context";

const ROLES: Role[] = ["user", "admin"];

const filterSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "REVIEW", "COMPLETE", "CANCELED"]).optional(),
  type: z.enum(["BUG", "FEATURE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  project: z
    .enum(["IVALT_MOBILE", "DOCU_ID", "ONDEMAND_ID", "KEYCLOCK", "OTHER"])
    .optional(),
  search: z.string().optional(),
});

export const adminRouter = {
  stats: adminProcedure
    .route({ method: "GET", path: "/admin/stats" })
    .input(z.object({ days: z.coerce.number().optional() }))
    .handler(async ({ input }) => {
      // `Number(...) || 30` in the REST handler, so a missing/invalid value is 30.
      const stats = await getSubmissionStats(input.days || 30);

      return {
        total: stats.total,
        byStatus: {
          open: stats.open,
          inProgress: stats.inProgress,
          review: stats.review,
          complete: stats.complete,
          canceled: stats.canceled,
        },
        byType: { bugs: stats.bugs, features: stats.features },
        users: stats.users,
        archived: stats.archived,
        overdue: stats.overdue,
        avgResolutionHours: stats.avgResolutionHours,
        byProject: stats.byProject,
        trend: stats.trend,
      };
    }),

  users: adminProcedure
    .route({ method: "GET", path: "/admin/users" })
    .input(z.object({ search: z.string().optional() }))
    .handler(async ({ input }) => listUsers({ search: input.search })),

  /** Promotes or demotes a user. Admins cannot change their own role. */
  updateUserRole: adminProcedure
    .route({ method: "PATCH", path: "/admin/users/{id}" })
    .input(z.object({ id: z.string(), role: z.enum(ROLES) }))
    .handler(async ({ input, context }) => {
      // Guard against an admin locking themselves out of the only admin account.
      if (input.id === context.auth.user.id) {
        throw badRequest("You cannot change your own role");
      }

      const updated = await updateUserRole(input.id, input.role);
      if (!updated) throw notFound();

      return updated;
    }),

  views: adminProcedure
    .route({ method: "GET", path: "/admin/views" })
    .input(z.void().optional())
    .handler(async ({ context }) => listSavedViews(context.auth.user.id)),

  createView: adminProcedure
    .route({ method: "POST", path: "/admin/views", successStatus: 201 })
    .input(
      z.object({
        name: z.string(),
        filters: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!input.name?.trim()) throw badRequest("A view needs a name");

      return createSavedView({
        userId: context.auth.user.id,
        name: input.name.trim(),
        filters: input.filters,
      });
    }),

  /** Scoped by userId so one admin can never delete another's view. */
  deleteView: adminProcedure
    .route({ method: "DELETE", path: "/admin/views/{id}" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const deleted = await deleteSavedView(input.id, context.auth.user.id);
      if (!deleted) throw notFound();

      return { success: true };
    }),

  /**
   * Rows behind the CSV export. The `GET /api/admin/export` handler stays
   * bespoke REST because it has to stream `text/csv`, but it reads through
   * this same procedure so the filter logic lives in exactly one place.
   */
  exportRows: adminProcedure
    .route({ method: "GET", path: "/admin/export" })
    .input(filterSchema)
    .handler(async ({ input }) =>
      listSubmissions({
        ...(input.status ? { status: input.status } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.project ? { project: input.project } : {}),
        ...(input.search ? { search: input.search } : {}),
        sort: "createdAt",
        dir: "desc",
      }),
    ),
};
