import { cn, STATUS_COLORS, PRIORITY_COLORS, TYPE_COLORS, STATUS_LABELS, PROJECT_LABELS } from "@/lib/utils";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-500 border",
        STATUS_COLORS[status]
      )}
    >
      {STATUS_LABELS[status] ?? status}
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

export function ProjectBadge({ project }: { project: Project }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-500 border bg-zinc-800 text-zinc-300 border-zinc-700">
      {PROJECT_LABELS[project] ?? project}
    </span>
  );
}
