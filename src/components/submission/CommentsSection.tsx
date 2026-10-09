"use client";

import { useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import {
  CommentThread,
  type CommentAuthor,
  type ThreadComment,
} from "@/components/arc/comment-thread/comment-thread";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { COMMENT_REACTION_EMOJI } from "@/lib/comment-reactions";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useToggleCommentReaction,
  type CommentWithUser,
} from "@/hooks/use-comments";
import { formatDate } from "@/lib/utils";

/* Matches no author id, so no comment is treated as the viewer's own. */
const NO_CURRENT_USER = "__none__";

/** Root + three nested reply levels (matches server MAX_COMMENT_DEPTH). */
const MAX_REPLY_DEPTH = 3;

function buildThreadTree(comments: CommentWithUser[]): ThreadComment[] {
  const nodes = new Map<string, ThreadComment>();

  for (const comment of comments) {
    nodes.set(comment.id, {
      id: comment.id,
      author: {
        id: comment.userId,
        name: comment.user.name ?? comment.user.email,
        avatar: comment.user.image ?? undefined,
      },
      body: comment.deletedAt ? "" : comment.body,
      createdAt: formatDate(comment.createdAt),
      deleted: Boolean(comment.deletedAt),
      reactions: (comment.reactions ?? []).map((reaction) => ({
        emoji: reaction.emoji,
        users: reaction.users,
      })),
      replies: [],
    });
  }

  const roots: ThreadComment[] = [];
  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;
    if (comment.parentId && nodes.has(comment.parentId)) {
      const parent = nodes.get(comment.parentId)!;
      parent.replies = [...(parent.replies ?? []), node];
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * Discussion on a submission.
 *
 * Arc's `comment-thread` owns composer, nesting, and reactions. This section
 * maps its events onto persisted mutations and rebuilds the tree from the flat
 * API list (parentId + reactions).
 */
export default function CommentsSection({
  submissionId,
  currentUserId,
  currentUserName,
  currentUserImage,
  isAdmin = false,
}: {
  submissionId: string;
  currentUserId?: string;
  currentUserName?: string | null;
  currentUserImage?: string | null;
  isAdmin?: boolean;
}) {
  const { toast } = useToastStack();
  const commentsQuery = useComments(submissionId);
  const postComment = useCreateComment(submissionId);
  const removeComment = useDeleteComment(submissionId);
  const toggleReaction = useToggleCommentReaction(submissionId);

  const comments = commentsQuery.data;

  const threadComments = useMemo(
    () => (comments ? buildThreadTree(comments) : []),
    [comments],
  );

  const people = useMemo(() => {
    if (!comments) return [];
    const byId = new Map<string, CommentAuthor>();
    for (const comment of comments) {
      if (comment.deletedAt) continue;
      byId.set(comment.userId, {
        id: comment.userId,
        name: comment.user.name ?? comment.user.email,
        avatar: comment.user.image ?? undefined,
      });
    }
    if (currentUserId) {
      byId.set(currentUserId, {
        id: currentUserId,
        name: currentUserName?.trim() || "You",
        avatar: currentUserImage ?? undefined,
      });
    }
    return Array.from(byId.values());
  }, [comments, currentUserId, currentUserImage, currentUserName]);

  if (comments === undefined) {
    return (
      <section className="rounded-panel border border-border bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-500 text-secondary">
          <MessageSquare size={13} aria-hidden />
          Comments
        </h2>
        <Skeleton lines={4} label="Loading comments" />
      </section>
    );
  }

  const currentUser: CommentAuthor = {
    id: currentUserId ?? NO_CURRENT_USER,
    name: currentUserName?.trim() || "You",
    avatar: currentUserImage ?? undefined,
  };

  function handleChange(
    _next: ThreadComment[],
    event: Parameters<
      NonNullable<React.ComponentProps<typeof CommentThread>["onCommentsChange"]>
    >[1],
  ) {
    if (event.type === "reply") {
      postComment.mutate(
        {
          body: event.comment.body,
          parentId: event.parentId,
        },
        {
          onError: (error) =>
            toast({
              type: "error",
              title: error.message ?? "Could not post the comment",
            }),
        },
      );
      return;
    }

    if (event.type === "delete") {
      removeComment.mutate(event.id, {
        onError: (error) =>
          toast({
            type: "error",
            title: error.message ?? "Could not delete the comment",
          }),
      });
      return;
    }

    if (event.type === "react") {
      toggleReaction.mutate(
        {
          commentId: event.id,
          emoji: event.emoji,
          added: event.added,
        },
        {
          onError: (error) =>
            toast({
              type: "error",
              title: error.message ?? "Could not update the reaction",
            }),
        },
      );
      return;
    }

    if (event.type === "edit") {
      toast({
        type: "info",
        title: "Comments cannot be edited once posted",
      });
    }
  }

  return (
    <section className="rounded-panel border border-border bg-surface p-5">
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
        maxDepth={MAX_REPLY_DEPTH}
        reactions={[...COMMENT_REACTION_EMOJI]}
        onCommentsChange={handleChange}
      />

      {isAdmin && (
        <p className="mt-2.5 text-xs text-muted">
          As an admin you can delete any comment on this submission.
        </p>
      )}
    </section>
  );
}
