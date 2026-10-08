import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { createComment, deleteComment, getCommentById, listComments } from "@/db/comments";
import { createNotification } from "@/db/notifications";
import { getSubmissionById } from "@/db/submissions";
import { badRequest, forbidden, notFound, protectedProcedure } from "@/orpc/context";

const paramsSchema = z.object({ id: z.string() });

/** Resolves a submission the caller is allowed to see, or throws 404/403. */
async function requireVisibleSubmission(userId: string, role: string, submissionId: string) {
  const submission = await getSubmissionById(submissionId);
  if (!submission) throw notFound();
  if (role !== "admin" && submission.userId !== userId) throw forbidden();
  return submission;
}

export const commentsRouter = {
  list: protectedProcedure
    .route({ method: "GET", path: "/submissions/{id}/comments" })
    .input(paramsSchema)
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      await requireVisibleSubmission(user.id, user.role, input.id);

      return listComments(input.id);
    }),

  create: protectedProcedure
    .route({
      method: "POST",
      path: "/submissions/{id}/comments",
      successStatus: 201,
    })
    .input(paramsSchema.extend({ body: z.string() }))
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const text = input.body?.trim();

      if (!text) throw badRequest("Comment cannot be empty");
      if (text.length > 5000) throw badRequest("Comment is too long");

      const submission = await requireVisibleSubmission(user.id, user.role, input.id);

      const comment = await createComment({
        submissionId: input.id,
        userId: user.id,
        body: text,
      });

      if (!comment) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Could not save comment",
        });
      }

      // The owner is pinged when someone else joins the discussion.
      if (submission.userId !== user.id) {
        await createNotification({
          userId: submission.userId,
          submissionId: input.id,
          type: "comment",
          title: `New comment on "${submission.title}"`,
          body: user.name,
        });
      }

      return comment;
    }),

  /** Deletes a comment. Allowed for its author or any admin. */
  remove: protectedProcedure
    .route({ method: "DELETE", path: "/submissions/{id}/comments/{commentId}" })
    .input(paramsSchema.extend({ commentId: z.string() }))
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      await requireVisibleSubmission(user.id, user.role, input.id);

      const comment = await getCommentById(input.commentId);
      if (!comment || comment.submissionId !== input.id) throw notFound();

      if (comment.userId !== user.id && user.role !== "admin") throw forbidden();

      await deleteComment(input.commentId);
      return { success: true };
    }),
};
