import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { SubmissionHistory } from "@/db/types";

export type HistoryActor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

/** Shape returned by GET /api/submissions/[id]/history. */
export type HistoryEntry = SubmissionHistory & {
  changedBy: HistoryActor | null;
};

/**
 * Audit trail for one submission. A failed read resolves to an empty list, the
 * same empty state the section rendered before.
 */
export function useSubmissionHistory(submissionId: string) {
  return useQuery({
    queryKey: queryKeys.history(submissionId),
    queryFn: async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}/history`);
        if (!res.ok) return [];
        const data = (await res.json()) as HistoryEntry[] | null;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });
}
