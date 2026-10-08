import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { SubmissionWithUser } from "@/types";

const SUBMISSIONS_URL = "/api/submissions";

/**
 * Archived rows. The page already renders the list on the server, so those rows
 * seed the cache and no request fires on mount; every mutation invalidates the
 * key so the next read is a live one.
 */
export function useArchivedSubmissions(initialData: SubmissionWithUser[]) {
  return useQuery({
    queryKey: queryKeys.archived,
    queryFn: async () => {
      const res = await fetch(`${SUBMISSIONS_URL}?includeDeleted=true`);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = (await res.json()) as { submissions: SubmissionWithUser[]; total: number };
      return data.submissions;
    },
    initialData,
  });
}

/** Restores a soft-deleted submission, dropping the row optimistically. */
export function useRestoreArchivedSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${SUBMISSIONS_URL}/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Could not restore submission");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.archived });

      const previous = queryClient.getQueryData<SubmissionWithUser[]>(queryKeys.archived);
      queryClient.setQueryData<SubmissionWithUser[]>(queryKeys.archived, (current) =>
        current ? current.filter((submission) => submission.id !== id) : current,
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.archived, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.archived });
    },
  });
}

/** Hard-deletes a submission, dropping the row optimistically. */
export function useDeleteArchivedSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${SUBMISSIONS_URL}/${id}?permanent=true`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete submission");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.archived });

      const previous = queryClient.getQueryData<SubmissionWithUser[]>(queryKeys.archived);
      queryClient.setQueryData<SubmissionWithUser[]>(queryKeys.archived, (current) =>
        current ? current.filter((submission) => submission.id !== id) : current,
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.archived, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.archived });
    },
  });
}
