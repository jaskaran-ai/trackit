import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  createComment,
  deleteComment,
  getCommentById,
  listComments,
  toggleCommentReaction,
} from "@/db/comments";
import {
  COMMENT_REACTION_EMOJI,
  isAllowedReactionEmoji,
} from "@/lib/comment-reactions";
import { createNotification } from "@/db/notifications";
import { getSubmissionAccessRow } from "@/db/submissions";
import { badRequest, forbidden, notFound, protectedProcedure } from "@/orpc/context";

const paramsSchema = z.object({ id: z.string() });

/** Resolves a submission the caller is allowed to see, or throws 404/403. */
async function requireVisibleSubmission(userId: string, role: string, submissionId: string) {
  const submission = await getSubmissionAccessRow(submissionId);
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
    .input(
      paramsSchema.extend({
        body: z.string(),
        parentId: z.string().nullable().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const text = input.body?.trim();

      if (!text) throw badRequest("Comment cannot be empty");
      if (text.length > 5000) throw badRequest("Comment is too long");

      const submission = await requireVisibleSubmission(user.id, user.role, input.id);

      const result = await createComment({
        submissionId: input.id,
        userId: user.id,
        body: text,
        parentId: input.parentId ?? null,
      });

      if ("error" in result) {
        if (result.error === "parent_not_found" || result.error === "parent_deleted") {
          throw badRequest("Reply target was not found");
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Could not save comment",
        });
      }

      const comment = result.comment;

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
      if (comment.deletedAt) throw notFound();

      if (comment.userId !== user.id && user.role !== "admin") throw forbidden();

      const result = await deleteComment(input.commentId);
      return { success: true, soft: result.soft };
    }),

  /**
   * Toggle an emoji reaction on a comment. `added` is optional; when omitted the
   * server flips the current state.
   */
  react: protectedProcedure
    .route({ method: "POST", path: "/submissions/{id}/comments/{commentId}/react" })
    .input(
      paramsSchema.extend({
        commentId: z.string(),
        emoji: z.string().min(1).max(16),
        added: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      await requireVisibleSubmission(user.id, user.role, input.id);

      if (!isAllowedReactionEmoji(input.emoji)) {
        throw badRequest(
          `Reaction must be one of ${COMMENT_REACTION_EMOJI.join(" ")}`,
        );
      }

      const comment = await getCommentById(input.commentId);
      if (!comment || comment.submissionId !== input.id || comment.deletedAt) {
        throw notFound();
      }

      const result = await toggleCommentReaction({
        commentId: input.commentId,
        userId: user.id,
        emoji: input.emoji,
        added: input.added,
      });

      const refreshed = await getCommentById(input.commentId);
      return {
        added: result.added,
        reactions: refreshed?.reactions ?? [],
      };
    }),
};
