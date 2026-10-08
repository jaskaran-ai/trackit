import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { SubmissionComment } from "@/db/types";

export type CommentAuthor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

/** Shape returned by GET /api/submissions/[id]/comments. */
export type CommentWithUser = SubmissionComment & {
  user: CommentAuthor;
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
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not post comment");
      }
      return (await res.json()) as CommentWithUser;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<CommentWithUser[]>(queryKeys.comments(submissionId), (current) =>
        current ? [...current, created] : [created],
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments(submissionId) });
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
    },
    onSuccess: (_result, commentId) => {
      queryClient.setQueryData<CommentWithUser[]>(queryKeys.comments(submissionId), (current) =>
        current ? current.filter((comment) => comment.id !== commentId) : current,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments(submissionId) });
    },
  });
}
