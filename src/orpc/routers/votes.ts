import { z } from "zod";
import { countVotesBySubmission, getVoteSummary, listVotedSubmissionIds, toggleVote } from "@/db/votes";
import { getSubmissionAccessRow } from "@/db/submissions";
import { forbidden, notFound, protectedProcedure } from "@/orpc/context";

const paramsSchema = z.object({ id: z.string() });

export const votesRouter = {
  get: protectedProcedure
    .route({ method: "GET", path: "/submissions/{id}/vote" })
    .input(paramsSchema)
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const submission = await getSubmissionAccessRow(input.id);
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
      const submission = await getSubmissionAccessRow(input.id);
      if (!submission) throw notFound();
      if (user.role !== "admin" && submission.userId !== user.id) throw forbidden();

      return toggleVote(input.id, user.id);
    }),

  /**
   * Batched vote state for a list of submissions (dashboard / admin board).
   * One request per surface instead of one per feature row.
   */
  board: protectedProcedure
    .route({ method: "GET", path: "/submissions/votes" })
    .input(z.object({ ids: z.array(z.string()) }))
    .handler(async ({ input, context }) => {
      const [counts, votedIds] = await Promise.all([
        countVotesBySubmission(input.ids),
        listVotedSubmissionIds(input.ids, context.auth.user.id),
      ]);
      return {
        counts: Object.fromEntries(counts),
        votedIds: Array.from(votedIds),
      };
    }),
};
