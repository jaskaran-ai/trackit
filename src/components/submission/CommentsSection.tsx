"use client";

import { MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import {
  CommentThread,
  type CommentAuthor,
  type ThreadComment,
} from "@/components/arc/comment-thread/comment-thread";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/use-comments";

/* Matches no author id, so no comment is treated as the viewer's own. */
const NO_CURRENT_USER = "__none__";

/**
 * Discussion on a submission.
 *
 * Arc's `comment-thread` owns the composer, the nesting, and the empty state,
 * and reports exactly what changed through a typed event, so this file maps
 * those events onto the existing mutations rather than diffing a tree.
 *
 * Two of its affordances stay off. TrackIt's comment rows are flat and the
 * database has no parent column, so replies attach at depth 1 and are stored as
 * ordinary comments. Reactions are left unpassed, so no picker is offered rather
 * than offering one that has nowhere to save.
 */
export default function CommentsSection({
  submissionId,
  currentUserId,
  isAdmin = false,
}: {
  submissionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const commentsQuery = useComments(submissionId);
  const postComment = useCreateComment(submissionId);
  const removeComment = useDeleteComment(submissionId);

  const comments = commentsQuery.data;

  if (comments === undefined) {
    return (
      <section className="rounded-panel border border-border bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-500 text-secondary">
          <MessageSquare size={13} aria-hidden />
          Comments
        </h2>
        <div aria-busy="true">
          <Skeleton lines={4} />
        </div>
      </section>
    );
  }

  const people = comments.map((comment) => ({
    id: comment.userId,
    name: comment.user.name ?? comment.user.email,
    avatar: comment.user.image ?? undefined,
  }));

  /*
   * The thread needs a `currentUser` to decide which comments it offers edit and
   * delete on. When the page has no id for the viewer, an id that matches no
   * author is passed: the thread then offers no actions on any comment, which is
   * the read-only view, rather than offering edits the API would reject.
   */
  const own = currentUserId
    ? comments.find((comment) => comment.userId === currentUserId)
    : undefined;

  const currentUser: CommentAuthor = {
    id: currentUserId ?? NO_CURRENT_USER,
    name: own?.user.name ?? "You",
    avatar: own?.user.image ?? undefined,
  };

  const threadComments: ThreadComment[] = comments.map((comment) => ({
    id: comment.id,
    author: {
      id: comment.userId,
      name: comment.user.name ?? comment.user.email,
      avatar: comment.user.image ?? undefined,
    },
    body: comment.body,
    createdAt: new Date(comment.createdAt).toISOString(),
  }));

  function handleChange(next: ThreadComment[], event: Parameters<NonNullable<React.ComponentProps<typeof CommentThread>["onCommentsChange"]>>[1]) {
    if (event.type === "reply") {
      postComment.mutate(event.comment.body, {
        onError: (error) => toast.error(error.message ?? "Could not post the comment"),
      });
      return;
    }

    if (event.type === "delete") {
      removeComment.mutate(event.id, {
        onSuccess: () => toast.success("Comment deleted"),
        onError: (error) => toast.error(error.message ?? "Could not delete the comment"),
      });
      return;
    }

    if (event.type === "edit") {
      /* Editing is not supported by the API. The thread still offers it, so the
         change is refused here rather than silently lost in the cache. */
      toast.error("Comments cannot be edited once posted");
    }
  }

  return (
    <section className="rounded-panel border border-border bg-surface p-6">
      <CommentThread
        title={
          <span className="flex items-center gap-2">
            <MessageSquare size={13} aria-hidden />
            Comments
          </span>
        }
        comments={threadComments}
        people={people}
        currentUser={currentUser}
        placeholder="Add a comment"
        /* TrackIt has no parent column, so a reply is stored as a plain comment
           rather than a nested one. */
        maxDepth={1}
        onCommentsChange={handleChange}
      />

      {isAdmin && (
        <p className="mt-3 text-xs text-muted">
          As an admin you can delete any comment on this submission.
        </p>
      )}
    </section>
  );
}