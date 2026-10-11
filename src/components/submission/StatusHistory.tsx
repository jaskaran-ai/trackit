"use client";

import { useEffect, useRef } from "react";
import { History } from "lucide-react";
import { Timeline, type TimelineEvent } from "@/components/arc/timeline/timeline";
import { Button } from "@/components/arc/button/button";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { formatDate } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/labels";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import type { Priority, SubmissionStatus } from "@/db/types";
import { useSubmissionHistory, type HistoryEntry } from "@/hooks/use-status-history";
import { useClock } from "@/hooks/use-clock";

/** Fields that only carry a payload in toValue (no before/after pair). */
const EVENT_FIELDS = new Set(["created", "archived", "restored"]);

const FIELD_LABELS: Record<string, string> = {
  created: "created this",
  status: "changed the status",
  priority: "changed the priority",
  dueDate: "changed the due date",
  archived: "archived this",
  restored: "restored this",
};

/* How often the relative labels refresh. A minute keeps "2m ago" honest
   without re-rendering a read-only feed constantly. */
const CLOCK_TICK_MS = 60_000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function actorName(entry: HistoryEntry) {
  return entry.changedBy?.name || entry.changedBy?.email || "TrackIt";
}

/**
 * Renders one stored value through the shared label maps so tokens like
 * "IN_PROGRESS" or a raw ISO timestamp never reach the screen.
 */
function ValueChip({ field, value }: { field: string; value: string | null }) {
  if (!value) return <span className="text-xs text-muted">not set</span>;

  if (field === "status" && value in STATUS_LABELS) {
    return <StatusBadge status={value as SubmissionStatus} />;
  }
  if (field === "priority") {
    return <PriorityBadge priority={value as Priority} />;
  }
  if (field === "dueDate" || ISO_DATE.test(value)) {
    return <span className="text-xs text-secondary">{formatDate(value)}</span>;
  }
  return <span className="text-xs text-secondary">{value}</span>;
}

function Detail({ entry }: { entry: HistoryEntry }) {
  const { field, fromValue, toValue } = entry;

  if (EVENT_FIELDS.has(field)) {
    // The "created" event stores the opening status in toValue; archive and
    // restore events store the title.
    return (
      <div className="mt-1">
        <ValueChip field={field === "created" ? "status" : field} value={toValue} />
      </div>
    );
  }

  if (field === "status" || field === "priority" || field === "dueDate") {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <ValueChip field={field} value={fromValue} />
        <span className="text-xs text-muted" aria-hidden>
          →
        </span>
        <span className="sr-only">then</span>
        <ValueChip field={field} value={toValue} />
      </div>
    );
  }

  // Unknown field: fall back to the raw before and after pair.
  return (
    <p className="mt-1 text-xs text-secondary">
      {fromValue ?? "not set"} to {toValue ?? "not set"}
    </p>
  );
}

/**
 * The audit trail of status, priority, and due-date transitions.
 *
 * The timeline labels events relative to a clock, and `Date.now()` cannot be
 * read during render: the server has one answer and the browser another a moment
 * later, so the first paint would not match and React would discard it. The
 * clock is therefore null until an effect installs it, and the skeleton stands
 * in for that one frame. It then ticks so a page left open keeps saying "2m ago"
 * rather than freezing at whatever the first render measured.
 */
export default function StatusHistory({ submissionId }: { submissionId: string }) {
  const historyQuery = useSubmissionHistory(submissionId);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = historyQuery;
  const entries = historyQuery.data?.pages.flatMap((page) => page.items);
  const now = useClock(CLOCK_TICK_MS);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch the next page once the sentinel below the timeline scrolls into view.
  // Re-created after each fetch, so a short page keeps loading until it fills the viewport.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const events: TimelineEvent[] = (entries ?? []).map((entry) => ({
    id: entry.id,
    at: new Date(entry.createdAt).getTime(),
    actor: actorName(entry),
    title: FIELD_LABELS[entry.field] ?? `updated ${entry.field}`,
    meta: formatDate(entry.createdAt),
    detail: <Detail entry={entry} />,
    ...(entry.changedBy?.image ? { avatar: entry.changedBy.image } : {}),
  }));

  return (
    <section className="mb-3 rounded-panel border border-border bg-surface p-5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-500 text-secondary">
        <History size={13} aria-hidden />
        History
      </h2>

      {entries === undefined || now === null ? (
        <Skeleton lines={3} label="Loading history" />
      ) : events.length === 0 ? (
        <p className="text-sm text-muted">No changes recorded yet.</p>
      ) : (
        <>
          <Timeline label="Change history" events={events} now={now} />
          <div ref={sentinelRef} aria-hidden className="h-px" />
          {hasNextPage && (
            <div className="mt-3 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                loading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
          <span role="status" className="sr-only">
            {isFetchingNextPage ? "Loading more history" : ""}
          </span>
        </>
      )}
    </section>
  );
}