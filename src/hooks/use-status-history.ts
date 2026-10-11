import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { HISTORY_PAGE_SIZE } from "@/lib/history-paging";
import type { SubmissionHistory } from "@/db/types";

export type HistoryActor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

/** One row of the audit trail, as returned by GET /api/submissions/[id]/history. */
export type HistoryEntry = SubmissionHistory & {
  changedBy: HistoryActor | null;
};

/** A page of history, newest first. `nextCursor` is null on the last page. */
export type HistoryPage = {
  items: HistoryEntry[];
  nextCursor: string | null;
};

/** Cache shape for the infinite query; the server pages seed this directly. */
export type HistoryPages = { pages: HistoryPage[]; pageParams: (string | null)[] };

const EMPTY_PAGE: HistoryPage = { items: [], nextCursor: null };

/**
 * Audit trail for one submission, loaded `HISTORY_PAGE_SIZE` rows at a time.
 * A failed read resolves to an empty page, the same empty state the section
 * rendered before.
 */
export function useSubmissionHistory(submissionId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.history(submissionId),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(HISTORY_PAGE_SIZE) });
      if (pageParam) params.set("cursor", pageParam);

      try {
        const res = await fetch(`/api/submissions/${submissionId}/history?${params}`);
        if (!res.ok) return EMPTY_PAGE;
        const data = (await res.json()) as HistoryPage | null;
        return Array.isArray(data?.items) ? data : EMPTY_PAGE;
      } catch {
        return EMPTY_PAGE;
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
