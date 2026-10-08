import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StatusBadge, TypeBadge, PriorityBadge } from "./Badges";
import VoteButton from "./VoteButton";
import { Paperclip, Clock } from "lucide-react";
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
  const hasAttachments = submission.attachments.length > 0;

  return (
    // The whole card used to be one Link, so the vote affordance now lives in a
    // footer row outside it — clicking it never navigates.
    <div className="flex flex-col bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all duration-200">
      <Link href={href} className="block group p-4 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-500 text-zinc-100 group-hover:text-white line-clamp-1 flex-1 leading-snug">
            {submission.title}
          </h3>
          <StatusBadge status={submission.status} />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <TypeBadge type={submission.type} />
          <PriorityBadge priority={submission.priority} />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 mb-3">
            {submission.user.image ? (
              <img
                src={submission.user.image}
                alt={submission.user.name}
                className="w-4 h-4 rounded-full"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] text-white font-600">
                {submission.user.name?.[0]}
              </div>
            )}
            <span className="text-xs text-zinc-500 truncate">{submission.user.name}</span>
          </div>
        )}
      </Link>

      {/* Footer — deliberately outside the Link */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-800 text-xs text-zinc-600">
        {isFeature && (
          <VoteButton
            submissionId={submission.id}
            initialCount={submission.voteCount}
            initialHasVoted={submission.hasVoted}
            size="sm"
          />
        )}

        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDate(submission.createdAt)}
          </span>
          {hasAttachments && (
            <span className="flex items-center gap-1">
              <Paperclip size={11} />
              {submission.attachments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
