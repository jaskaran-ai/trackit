"use client";

import { History } from "lucide-react";
import { cn, formatDate, STATUS_LABELS } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import type { Priority, SubmissionStatus } from "@/db/types";
import { useSubmissionHistory, type HistoryEntry } from "@/hooks/use-status-history";

/** Fields that only carry a payload in toValue (no before/after pair). */
const EVENT_FIELDS = new Set(["created", "archived", "restored"]);

const FIELD_LABELS: Record<string, string> = {
  created: "Created",
  status: "Status",
  priority: "Priority",
  dueDate: "Due date",
  archived: "Archived",
  restored: "Restored",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field;
}

function actorName(entry: HistoryEntry) {
  return entry.changedBy?.name || entry.changedBy?.email || "TrackIt";
}

/**
 * Renders one stored value through the shared label maps so tokens like
 * "IN_PROGRESS" or an ISO timestamp never reach the screen raw.
 */
function ValueChip({ field, value }: { field: string; value: string | null }) {
  if (!value) return <span className="text-xs text-zinc-600">not set</span>;

  if (field === "status" && value in STATUS_LABELS) {
    return <StatusBadge status={value as SubmissionStatus} />;
  }
  if (field === "priority") {
    return <PriorityBadge priority={value as Priority} />;
  }
  if (field === "dueDate" || ISO_DATE.test(value)) {
    return <span className="text-xs text-zinc-300">{formatDate(value)}</span>;
  }
  return <span className="text-xs text-zinc-300">{value}</span>;
}

function Detail({ entry }: { entry: HistoryEntry }) {
  const { field, fromValue, toValue } = entry;

  if (EVENT_FIELDS.has(field)) {
    // The "created" event stores the opening status in toValue; archive and
    // restore events store the title.
    const chipField = field === "created" ? "status" : field;
    return (
      <div className="mt-0.5">
        <ValueChip field={chipField} value={toValue} />
      </div>
    );
  }

  if (field === "status" || field === "priority" || field === "dueDate") {
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
        <ValueChip field={field} value={fromValue} />
        <span className="text-xs text-zinc-600">→</span>
        <ValueChip field={field} value={toValue} />
      </div>
    );
  }

  // Unknown field: fall back to the raw before/after pair.
  return (
    <p className="text-xs text-zinc-400 mt-0.5">
      {fromValue ?? "—"} → {toValue ?? "—"}
    </p>
  );
}

export default function StatusHistory({ submissionId }: { submissionId: string }) {
  const historyQuery = useSubmissionHistory(submissionId);
  const entries = historyQuery.data;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
      <h2 className="font-display text-sm font-600 text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <History size={13} />
        History
      </h2>

      {entries === undefined ? (
        <div className="space-y-4 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-zinc-800 mt-1.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-44 bg-zinc-800 rounded" />
                <div className="h-3 w-24 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-zinc-600">No changes recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {entries.map((entry, index) => (
            <li key={entry.id} className="flex gap-3">
              {/* Timeline rail */}
              <div className="flex flex-col items-center shrink-0 pt-1.5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    index === 0 ? "bg-indigo-500" : "bg-zinc-700"
                  )}
                />
                {index < entries.length - 1 && (
                  <span className="w-px flex-1 bg-zinc-800 mt-1" />
                )}
              </div>

              <div className="min-w-0 flex-1 -mt-0.5">
                <p className="text-sm text-zinc-200 font-500">
                  {actorName(entry)}
                  <span className="text-zinc-500"> · {fieldLabel(entry.field)}</span>
                </p>
                <Detail entry={entry} />
                <p className="text-xs text-zinc-600 mt-1">{formatDate(entry.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
