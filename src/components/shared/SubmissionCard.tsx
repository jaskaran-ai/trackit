import Link from "next/link";
import { Clock, Paperclip } from "lucide-react";
import { formatDate, submissionAttachmentCount } from "@/lib/utils";
import { Avatar } from "@/components/arc/avatar/avatar";
import { StatusBadge, TypeBadge, PriorityBadge } from "./Badges";
import VoteButton from "./VoteButton";
import type { SubmissionWithUser } from "@/types";

// Server pages attach vote state to each row so listed cards render without a
// per-card vote request. The fields stay optional: callers that omit them keep
// VoteButton's one-shot fetch on mount.
type CardSubmission = SubmissionWithUser & {
  voteCount?: number;
  hasVoted?: boolean;
};

interface SubmissionCardProps {
  submission: CardSubmission;
  isAdmin?: boolean;
}

export default function SubmissionCard({ submission, isAdmin }: SubmissionCardProps) {
  const href = isAdmin
    ? `/admin/submission/${submission.id}`
    : `/submission/${submission.id}`;

  const isFeature = submission.type === "FEATURE";
  const attachmentCount = submissionAttachmentCount(submission);
  const hasAttachments = attachmentCount > 0;

  return (
    // The card is not one link: the title region navigates, the footer holds the
    // vote control, and nesting a button inside a link would make clicking it
    // ambiguous.
    <div className="flex flex-col rounded-panel border border-border bg-surface transition-colors hover:border-border-strong">
      <Link href={href} className="group block flex-1 p-3.5 sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 flex-1 text-sm font-500 leading-snug text-foreground group-hover:underline">
            {submission.title}
          </h3>
          <StatusBadge status={submission.status} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <TypeBadge type={submission.type} />
          <PriorityBadge priority={submission.priority} />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Avatar
              name={submission.user.name ?? "Unknown"}
              src={submission.user.image ?? undefined}
              size="sm"
            />
            <span className="truncate text-xs text-muted">
              {submission.user.name}
            </span>
          </div>
        )}
      </Link>

      {/* Footer — deliberately outside the Link */}
      <div className="flex items-center gap-2.5 border-t border-[var(--border-subtle)] px-3.5 py-3 text-xs text-muted sm:px-4">
        {isFeature && (
          <VoteButton
            submissionId={submission.id}
            initialCount={submission.voteCount}
            initialHasVoted={submission.hasVoted}
            size="sm"
          />
        )}

        <div className="ml-auto flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <Clock size={11} aria-hidden />
            {formatDate(submission.createdAt)}
          </span>
          {hasAttachments && (
            <span className="flex items-center gap-1">
              <Paperclip size={11} aria-hidden />
              {attachmentCount}
              <span className="sr-only"> attachments</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
