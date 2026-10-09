"use client";

import { motion } from "motion/react";
import { LineChart } from "@/components/arc/line-chart/line-chart";
import { PROJECT_LABELS } from "@/lib/labels";
import type { Project } from "@/db/types";

export type AdminStats = {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    review: number;
    /** complete + canceled; kept for older chart readers. */
    resolved?: number;
    complete: number;
    canceled: number;
  };
  byType: { bugs: number; features: number };
  users: number;
  archived: number;
  overdue: number;
  avgResolutionHours: number | null;
  byProject: Array<{ project: string; total: number; open: number }>;
  trend: Array<{ date: string; created: number; resolved: number }>;
};

/* The trend arrives as `YYYY-MM-DD` keys. Building the label from the parts
   rather than `new Date(key)` keeps it off UTC: parsed as UTC and then
   formatted in a negative offset, "2026-03-01" renders as the previous day. */
function dayParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function longDate(date: string) {
  const { year, month, day } = dayParts(date);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDate(date: string) {
  const { month, day } = dayParts(date);
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * The two charts only. The KPI row lives on the admin page itself, which used
 * to render its own set of stat cards; having a second row here meant the same
 * numbers appeared twice on one screen.
 *
 * Compact layout: the 30-day trend sits beside the per-project breakdown in
 * one panel, so both read at a glance without pushing the submissions table
 * off the first screenful. The project breakdown is a slim bar list instead of
 * a full column chart — a handful of categories does not need an axis.
 */
export default function StatsCharts({ stats }: { stats: AdminStats }) {
  const trend = stats.trend ?? [];
  const hasTrend = trend.some((day) => day.created > 0 || day.resolved > 0);

  const projects = [...(stats.byProject ?? [])].sort(
    (a, b) => b.total - a.total,
  );
  const peak = Math.max(...projects.map((row) => row.total), 1);

  return (
    <div className="grid gap-px overflow-hidden rounded-panel border border-border bg-[var(--border-subtle)] lg:grid-cols-5">
      <div className="bg-surface p-3 lg:col-span-3">
        <LineChart
          label="Created and resolved over the last 30 days"
          height={152}
          data={trend.map((day) => ({
            key: day.date,
            label: longDate(day.date),
            // Only the first of each month is labelled; the rest stay quiet so
            // the axis does not become a wall of dates at phone widths.
            axisLabel: day.date.endsWith("01") ? shortDate(day.date) : undefined,
            values: { created: day.created, resolved: day.resolved },
          }))}
          series={[
            { key: "created", label: "Created" },
            { key: "resolved", label: "Resolved" },
          ]}
          emptyLabel="No submissions in the last 30 days"
          loading={!hasTrend}
        />
      </div>

      <div className="bg-surface p-3 lg:col-span-2">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-500 text-foreground">By project</h3>
          <span className="text-xs text-muted">All time</span>
        </div>
        {projects.length === 0 ? (
          <p className="flex h-24 items-center justify-center text-sm text-muted">
            No submissions yet
          </p>
        ) : (
          <ul className="space-y-2.5">
            {projects.map((row, index) => {
              const name = PROJECT_LABELS[row.project as Project] ?? row.project;
              return (
                <li key={row.project} className="flex items-center gap-2.5">
                  <span className="w-28 shrink-0 truncate text-xs text-secondary sm:w-32">
                    {name}
                  </span>
                  <span
                    className="h-4 min-w-0 flex-1 rounded-full bg-[var(--surface-muted)]"
                    role="img"
                    aria-label={`${name}: ${row.total} submissions, ${row.open} still open`}
                  >
                    <motion.span
                      className="block h-full rounded-full bg-[var(--accent)]/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.total / peak) * 100}%` }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.045,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs font-500 tabular-nums text-foreground">
                    {row.total}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
