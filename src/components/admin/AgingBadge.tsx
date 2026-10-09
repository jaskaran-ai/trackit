"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/arc/badge/badge";
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
 * How long a submission has been open. Resolved or archived items render
 * nothing, so a settled row carries no age at all.
 *
 * Thresholds are the SLA, so they are named rather than inlined into a colour
 * decision: three days is a warning, seven is overdue.
 */
const AMBER_DAYS = 3;
const RED_DAYS = 7;

export default function AgingBadge({
  createdAt,
  dueDate,
  status,
  resolvedAt,
}: AgingBadgeProps) {
  const isResolved = RESOLVED.includes(status) || Boolean(resolvedAt);

  /*
   * Age is measured against the current time, and `Date.now()` cannot be read
   * during render: the server and the browser each answer, and around midnight
   * they disagree by a day, so React would throw the first paint away and the
   * table would flicker. The clock is therefore null until an effect installs
   * it, and the badge stays absent for that one frame, exactly as it does for a
   * resolved row.
   */
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  if (isResolved || now === null) return null;

  const openedAt = new Date(createdAt).getTime();
  const days = Math.max(0, Math.floor((now - openedAt) / DAY_MS));

  const due = dueDate ? new Date(dueDate) : null;
  const isPastDue = Boolean(due && due.getTime() < now);

  const tone: BadgeTone = isPastDue || days >= RED_DAYS ? "danger" : days >= AMBER_DAYS ? "warning" : "success";

  const title = due
    ? `Open ${days} days, due ${formatDate(due)}`
    : `Open ${days} days`;

  return (
    <Badge
      tone={tone}
      size="sm"
      icon={<Clock size={9} aria-hidden />}
      title={title}
    >
      {isPastDue ? "Overdue " : ""}
      <span className="tabular-nums">{days}d</span>
      <span className="sr-only">{isPastDue ? ", past its due date" : ""}</span>
    </Badge>
  );
}