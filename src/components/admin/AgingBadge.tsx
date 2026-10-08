"use client";

import { Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { SubmissionStatus } from "@/db/types";

const RESOLVED: SubmissionStatus[] = ["COMPLETE", "CANCELED"];
const DAY_MS = 86_400_000;

type AgingBadgeProps = {
  createdAt: Date | string;
  dueDate?: Date | null;
  status: SubmissionStatus;
  resolvedAt?: Date | null;
};

/**
 * Compact traffic-light pill for how long a submission has been open.
 * Resolved or archived items render nothing.
 */
export default function AgingBadge({
  createdAt,
  dueDate,
  status,
  resolvedAt,
}: AgingBadgeProps) {
  const isResolved = RESOLVED.includes(status) || Boolean(resolvedAt);
  if (isResolved) return null;

  const openedAt = new Date(createdAt).getTime();
  const now = Date.now();
  const days = Math.max(0, Math.floor((now - openedAt) / DAY_MS));

  const due = dueDate ? new Date(dueDate) : null;
  const isPastDue = Boolean(due && due.getTime() < now);

  const isRed = isPastDue || days >= 7;
  const isAmber = !isRed && days >= 3;

  const tone = isRed
    ? "bg-red-500/10 text-red-400 border-red-500/30"
    : isAmber
      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-400/90 border-emerald-500/20";

  const title = isPastDue
    ? `${days}d open · due ${formatDate(due as Date)}`
    : `${days}d open`;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[11px] font-500 leading-none whitespace-nowrap",
        tone
      )}
    >
      <Clock size={9} className="shrink-0" />
      {isPastDue && <span className="font-600">overdue</span>}
      <span className="tabular-nums">{days}d</span>
    </span>
  );
}
