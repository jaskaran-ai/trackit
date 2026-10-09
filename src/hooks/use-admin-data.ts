import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { AdminUserRow } from "@/db/users";
import type { SubmissionWithUser } from "@/types";
import type { AdminStats } from "@/components/admin/StatsCharts";

/** Board statistics: totals, status breakdown, and the series the charts plot. */
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      return (await res.json()) as AdminStats;
    },
  });
}

/** Every user row plus the roles the management table toggles. */
export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      return (await res.json()) as AdminUserRow[];
    },
  });
}

/** The board's submission rows; vote data arrives separately via useAdminVotes. */
export function useAdminSubmissions() {
  return useQuery({
    queryKey: queryKeys.adminSubmissions,
    queryFn: async () => {
      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = (await res.json()) as {
        submissions: SubmissionWithUser[];
        total: number;
      };
      return data.submissions;
    },
  });
}

export type AdminVotes = {
  counts: Record<string, number>;
  votedSet: Set<string>;
};

/** Wire format stored in the query cache (SSR-safe). */
type AdminVotesPayload = {
  counts: Record<string, number>;
  votedIds?: string[];
  votedSet?: Set<string> | string[];
};

function toAdminVotes(data: AdminVotesPayload): AdminVotes {
  if (data.votedSet instanceof Set) {
    return { counts: data.counts, votedSet: data.votedSet };
  }
  const ids = data.votedIds ?? (Array.isArray(data.votedSet) ? data.votedSet : []);
  return { counts: data.counts, votedSet: new Set(ids) };
}

/**
 * Vote counts and the caller's voted ids for the given submissions.
 *
 * `queryKeys.adminVotes` is a prefix key shared by every vote query. That is
 * intentional: the admin board has a single vote list, and one cache entry
 * keeps every reader on the same data instead of one entry per id set.
 */
export function useAdminVotes(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.adminVotes,
    queryFn: async () => {
      const res = await fetch(`/api/admin/votes?ids=${ids.join(",")}`);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = (await res.json()) as {
        counts: Record<string, number>;
        votedIds: string[];
      };
      return data;
    },
    enabled: ids.length > 0,
    select: (data) => toAdminVotes(data as AdminVotesPayload),
  });
}
