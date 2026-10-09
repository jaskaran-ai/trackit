"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";
import { formatDate, submissionAttachmentCount } from "@/lib/utils";
import {
  PriorityBadge,
  ProjectBadge,
  StatusBadge,
  TypeBadge,
} from "@/components/shared/Badges";
import VoteButton from "@/components/shared/VoteButton";
import type { SubmissionWithUser } from "@/types";

type TableRow = SubmissionWithUser & {
  voteCount?: number;
  hasVoted?: boolean;
};

export default function DashboardSubmissionsTable({
  submissions,
}: {
  submissions: TableRow[];
}) {
  return (
    <div className="overflow-hidden rounded-panel border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Your submissions</caption>
          <thead>
            <tr className="border-b border-border bg-surface-muted/40 text-left text-xs text-muted">
              <th className="px-3 py-2.5 font-medium">Title</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Priority</th>
              <th className="px-3 py-2.5 font-medium">Project</th>
              <th className="px-3 py-2.5 font-medium">Votes</th>
              <th className="px-3 py-2.5 font-medium">Updated</th>
              <th className="px-3 py-2.5 font-medium w-10">
                <span className="sr-only">Attachments</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => {
              const isFeature = submission.type === "FEATURE";
              const attachmentCount = submissionAttachmentCount(submission);

              return (
                <tr
                  key={submission.id}
                  className="border-b border-[var(--border-subtle)]/60 transition-colors last:border-0 hover:bg-surface-muted/30"
                >
                  <td className="max-w-[220px] px-3 py-2.5">
                    <Link
                      href={`/submission/${submission.id}`}
                      className="line-clamp-1 font-500 text-foreground hover:underline"
                    >
                      {submission.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <TypeBadge type={submission.type} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <PriorityBadge priority={submission.priority} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <ProjectBadge project={submission.project} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {isFeature ? (
                      <VoteButton
                        submissionId={submission.id}
                        initialCount={submission.voteCount}
                        initialHasVoted={submission.hasVoted}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted">
                    {formatDate(submission.updatedAt)}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-muted">
                    {attachmentCount > 0 ? (
                      <span
                        className="inline-flex items-center gap-0.5"
                        title={`${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`}
                      >
                        <Paperclip size={12} aria-hidden />
                        {attachmentCount}
                      </span>
                    ) : (
                      <span aria-hidden>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
