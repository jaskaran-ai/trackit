import { z } from "zod";
import { getVoteSummary, toggleVote } from "@/db/votes";
import { getSubmissionById } from "@/db/submissions";
import { forbidden, notFound, protectedProcedure } from "@/orpc/context";

const paramsSchema = z.object({ id: z.string() });

export const votesRouter = {
  get: protectedProcedure
    .route({ method: "GET", path: "/submissions/{id}/vote" })
    .input(paramsSchema)
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const submission = await getSubmissionById(input.id);
      if (!submission) throw notFound();
      if (user.role !== "admin" && submission.userId !== user.id) throw forbidden();

      return getVoteSummary(input.id, user.id);
    }),

  /**
   * Toggles the vote. The client sends what the user clicked, not the state it
   * thinks it's in, so a double submit stays idempotent. Both POST and DELETE
   * reach this same procedure in the REST adapter.
   */
  toggle: protectedProcedure
    .route({ method: "POST", path: "/submissions/{id}/vote" })
    .input(paramsSchema)
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const submission = await getSubmissionById(input.id);
      if (!submission) throw notFound();
      if (user.role !== "admin" && submission.userId !== user.id) throw forbidden();

      return toggleVote(input.id, user.id);
    }),
};
