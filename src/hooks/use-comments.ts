import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { SubmissionComment } from "@/db/types";

export type CommentAuthor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type CommentReactionGroup = {
  emoji: string;
  users: string[];
};

/** Shape returned by GET /api/submissions/[id]/comments. */
export type CommentWithUser = SubmissionComment & {
  user: CommentAuthor;
  reactions: CommentReactionGroup[];
  parentId: string | null;
  deletedAt: Date | string | null;
};

/**
 * Comments for one submission. A failed read resolves to an empty list, which is
 * what the section already rendered before, so nothing new appears on screen.
 */
export function useComments(submissionId: string) {
  return useQuery({
    queryKey: queryKeys.comments(submissionId),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}/comments`);
        if (!res.ok) return [];
        const data = (await res.json()) as CommentWithUser[] | null;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });
}

export function useCreateComment(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { body: string; parentId?: string | null }) => {
      const res = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: input.body,
          parentId: input.parentId ?? null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not post comment");
      }
      return (await res.json()) as CommentWithUser;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<CommentWithUser[]>(
        queryKeys.comments(submissionId),
        (current) => (current ? [...current, created] : [created]),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.comments(submissionId),
      });
    },
  });
}

export function useDeleteComment(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(
        `/api/submissions/${submissionId}/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Could not delete comment");
      return (await res.json()) as { success: boolean; soft?: boolean };
    },
    onSuccess: (result, commentId) => {
      queryClient.setQueryData<CommentWithUser[]>(
        queryKeys.comments(submissionId),
        (current) => {
          if (!current) return current;
          if (result.soft) {
            return current.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    body: "",
                    deletedAt: new Date(),
                    reactions: [],
                  }
                : comment,
            );
          }
          const remove = new Set<string>([commentId]);
          let grew = true;
          while (grew) {
            grew = false;
            for (const comment of current) {
              if (comment.parentId && remove.has(comment.parentId) && !remove.has(comment.id)) {
                remove.add(comment.id);
                grew = true;
              }
            }
          }
          return current.filter((comment) => !remove.has(comment.id));
        },
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.comments(submissionId),
      });
    },
  });
}

export function useToggleCommentReaction(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      commentId: string;
      emoji: string;
      added: boolean;
    }) => {
      const res = await fetch(
        `/api/submissions/${submissionId}/comments/${input.commentId}/react`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji: input.emoji, added: input.added }),
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not update reaction");
      }
      return (await res.json()) as {
        added: boolean;
        reactions: CommentReactionGroup[];
      };
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData<CommentWithUser[]>(
        queryKeys.comments(submissionId),
        (current) =>
          current?.map((comment) =>
            comment.id === variables.commentId
              ? { ...comment, reactions: result.reactions }
              : comment,
          ),
      );
    },
  });
}
