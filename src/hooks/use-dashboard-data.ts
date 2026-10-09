import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { SubmissionWithUser } from "@/types";

/** Shape returned by GET /api/submissions/summary. */
export type DashboardSummary = {
  total: number;
  open: number;
  bugs: number;
  features: number;
  submissions: SubmissionWithUser[];
  totalRows?: number;
  votes: {
    counts: Record<string, number>;
    votedIds: string[];
  };
};

/** Serializable votes cache payload (survives dehydrate). */
export type DashboardVotesPayload = {
  counts: Record<string, number>;
  votedIds: string[];
};

export type DashboardVotes = {
  counts: Record<string, number>;
  votedSet: Set<string>;
};

async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch("/api/submissions/summary");
  if (!res.ok) throw new Error(`Request failed with ${res.status}`);
  return (await res.json()) as DashboardSummary;
}

/** One request for metrics, lean rows, and the vote board. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: fetchDashboardSummary,
  });
}

/** Total submissions for the signed-in user. */
export function useDashboardTotalCount() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: fetchDashboardSummary,
    select: (s) => s.total,
  });
}

/** Bug reports reported by the signed-in user. */
export function useDashboardBugCount() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: fetchDashboardSummary,
    select: (s) => s.bugs,
  });
}

/** Feature requests reported by the signed-in user. */
export function useDashboardFeatureCount() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: fetchDashboardSummary,
    select: (s) => s.features,
  });
}

/** Submissions still open, in progress, or in review. */
export function useDashboardOpenCount() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: fetchDashboardSummary,
    select: (s) => s.open,
  });
}

/**
 * The user's submission rows for the dashboard list.
 * Prefers the summary cache; falls back to GET /api/submissions if needed.
 */
export function useDashboardSubmissions() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard.submissions,
    queryFn: async () => {
      const summary = queryClient.getQueryData<DashboardSummary>(
        queryKeys.dashboard.summary,
      );
      if (summary?.submissions) return summary.submissions;

      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = (await res.json()) as {
        submissions: SubmissionWithUser[];
        total: number;
      };
      return data.submissions;
    },
    initialData: () =>
      queryClient.getQueryData<DashboardSummary>(queryKeys.dashboard.summary)
        ?.submissions,
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.dashboard.summary)?.dataUpdatedAt,
  });
}

/**
 * Vote counts and the caller's voted ids.
 * Cache stores votedIds (JSON-safe); select builds the Set for callers.
 */
export function useDashboardVotes(ids: string[]) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard.votes,
    queryFn: async (): Promise<DashboardVotesPayload> => {
      const summary = queryClient.getQueryData<DashboardSummary>(
        queryKeys.dashboard.summary,
      );
      if (summary?.votes) {
        return {
          counts: summary.votes.counts,
          votedIds: summary.votes.votedIds,
        };
      }

      const res = await fetch(`/api/submissions/votes?ids=${ids.join(",")}`);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = (await res.json()) as {
        counts: Record<string, number>;
        votedIds: string[];
      };
      return {
        counts: data.counts,
        votedIds: data.votedIds,
      };
    },
    select: (payload): DashboardVotes => ({
      counts: payload.counts,
      votedSet: new Set(payload.votedIds),
    }),
    enabled: ids.length > 0,
    initialData: () => {
      const summary = queryClient.getQueryData<DashboardSummary>(
        queryKeys.dashboard.summary,
      );
      if (!summary?.votes) return undefined;
      return {
        counts: summary.votes.counts,
        votedIds: summary.votes.votedIds,
      };
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.dashboard.summary)?.dataUpdatedAt,
  });
}
