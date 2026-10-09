import { ArrowDown, ArrowRight, ArrowUp, Bug, Sparkles, Zap } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/arc/badge/badge";
import { PRIORITY_LABELS, PROJECT_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";

/*
 * Status and priority are the two places in this app where colour carries
 * meaning, so they map onto Arc's semantic tones rather than raw hues. A tone
 * change here is a design decision: it means a status started or stopped
 * reading as urgent.
 */

const STATUS_TONES: Record<SubmissionStatus, BadgeTone> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  REVIEW: "info",
  COMPLETE: "success",
  CANCELED: "neutral",
};

const PRIORITY_TONES: Record<Priority, BadgeTone> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

/* An arrow reads the level at a glance and needs no legend; Zap marks the one
   level that is not just "more". */
const PRIORITY_ICONS: Record<Priority, typeof ArrowUp> = {
  LOW: ArrowDown,
  MEDIUM: ArrowRight,
  HIGH: ArrowUp,
  CRITICAL: Zap,
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} size="sm">
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: SubmissionType }) {
  return type === "BUG" ? (
    <Badge tone="danger" size="sm" icon={<Bug size={12} aria-hidden />}>
      Bug
    </Badge>
  ) : (
    <Badge tone="neutral" size="sm" icon={<Sparkles size={12} aria-hidden />}>
      Feature
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = PRIORITY_ICONS[priority];
  return (
    <Badge tone={PRIORITY_TONES[priority]} size="sm" icon={<Icon size={12} aria-hidden />}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

/* The project is a grouping label, not a state, so it stays neutral. */
export function ProjectBadge({ project }: { project: Project }) {
  return <Badge tone="neutral" size="sm">{PROJECT_LABELS[project] ?? project}</Badge>;
}