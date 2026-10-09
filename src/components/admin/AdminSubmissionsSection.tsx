"use client";

import { useMemo } from "react";
import AdminViewToggle from "@/app/admin/AdminViewToggle";
import AdminTable from "@/app/admin/AdminTable";
import KanbanBoard from "@/app/admin/KanbanBoard";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { useAdminSubmissions, useAdminVotes } from "@/hooks/use-admin-data";
import type { SubmissionWithUser } from "@/types";

type SubmissionWithVotes = SubmissionWithUser & {
  voteCount: number;
  hasVoted: boolean;
};

/**
 * The board's rows plus their vote state. The two requests are independent:
 * the id list comes from the submissions response, then votes are fetched once
 * for the whole board rather than once per row.
 */
export default function AdminSubmissionsSection() {
  const { data: submissions } = useAdminSubmissions();
  const featureIds = useMemo(
    () => (submissions ?? []).filter((s) => s.type === "FEATURE").map((s) => s.id),
    [submissions],
  );
  const { data: votes } = useAdminVotes(featureIds);

  const rows = (submissions ?? []).map((submission) => ({
    ...submission,
    voteCount: votes?.counts[submission.id] ?? 0,
    hasVoted: votes?.votedSet.has(submission.id) ?? false,
  })) as SubmissionWithVotes[];

  return (
    <Skeleton loading={!submissions} lines={5} label="Loading submissions">
      {submissions ? (
        <AdminViewToggle
          tableView={<AdminTable submissions={rows} />}
          kanbanView={<KanbanBoard submissions={rows} />}
        />
      ) : null}
    </Skeleton>
  );
}
