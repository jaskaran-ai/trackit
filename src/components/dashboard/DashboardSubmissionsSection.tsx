"use client";

import { Inbox } from "lucide-react";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { useDashboardSummary } from "@/hooks/use-dashboard-data";
import type { SubmissionWithUser } from "@/types";

type SubmissionWithVotes = SubmissionWithUser & {
  voteCount: number;
  hasVoted: boolean;
};

/**
 * Rows and vote state come from the same summary payload so the list does not
 * wait on a second votes hop after features arrive.
 */
export default function DashboardSubmissionsSection() {
  const { data: summary, isPending } = useDashboardSummary();

  const submissions = summary?.submissions ?? [];
  const voteCounts = summary?.votes?.counts ?? {};
  const votedIds = summary?.votes?.votedIds ?? [];
  const votedLookup: Record<string, true> = {};
  for (const id of votedIds) votedLookup[id] = true;

  const rows = submissions.map((submission) => ({
    ...submission,
    voteCount: voteCounts[submission.id] ?? 0,
    hasVoted: Boolean(votedLookup[submission.id]),
  })) as SubmissionWithVotes[];

  return (
    <Skeleton
      loading={isPending && !summary}
      lines={5}
      label="Loading submissions"
    >
      {!summary ? null : submissions.length === 0 ? (
        <div className="rounded-panel border border-border bg-surface">
          <EmptyState
            className="py-10"
            icon={<Inbox size={20} aria-hidden />}
            title="No submissions yet"
            description="Anything you report will show up here, with its status and who is looking at it."
          />
        </div>
      ) : (
        <DashboardFilters submissions={rows} />
      )}
    </Skeleton>
  );
}
