import { cn, STATUS_COLORS, PRIORITY_COLORS, TYPE_COLORS } from "@/lib/utils";
import type { SubmissionStatus, SubmissionType, Priority } from "@prisma/client";

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const labels: Record<SubmissionStatus, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-500 border",
        STATUS_COLORS[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: SubmissionType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-500 border",
        TYPE_COLORS[type]
      )}
    >
      {type === "BUG" ? "🐛 Bug" : "✨ Feature"}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const labels: Record<Priority, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };
  const icons: Record<Priority, string> = {
    LOW: "↓",
    MEDIUM: "→",
    HIGH: "↑",
    CRITICAL: "⚡",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-500 border",
        PRIORITY_COLORS[priority]
      )}
    >
      <span>{icons[priority]}</span>
      {labels[priority]}
    </span>
  );
}
