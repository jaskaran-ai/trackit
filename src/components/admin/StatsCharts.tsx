"use client";

import { LineChart } from "@/components/arc/line-chart/line-chart";
import { BarChart } from "@/components/arc/bar-chart/bar-chart";
import { PROJECT_LABELS } from "@/lib/labels";
import type { Project } from "@/db/types";

export type AdminStats = {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    review: number;
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
    weekday: "short",
    month: "short",
    day: "numeric",
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
 */
export default function StatsCharts({ stats }: { stats: AdminStats }) {
  const trend = stats.trend ?? [];
  const hasTrend = trend.some((day) => day.created > 0 || day.resolved > 0);

  const projects = [...(stats.byProject ?? [])].sort(
    (a, b) => b.total - a.total,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-panel border border-border bg-surface p-4">
        <LineChart
          label="Created and resolved over the last 30 days"
          height={180}
          data={trend.map((day) => ({
            key: day.date,
            label: longDate(day.date),
            // Every fifth day is labelled; the rest stay quiet so the axis does
            // not become a wall of dates at phone widths.
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

      <div className="rounded-panel border border-border bg-surface p-4">
        <BarChart
          label="Submissions per project"
          period="All time"
          categoryLabel="Project"
          height={160}
          data={projects.map((row) => ({
            key: row.project,
            label: `${PROJECT_LABELS[row.project as Project] ?? row.project}, ${row.open} still open of ${row.total}`,
            axisLabel: PROJECT_LABELS[row.project as Project] ?? row.project,
            value: row.total,
          }))}
        />
      </div>
    </div>
  );
}