"use client";

import { Activity, FolderKanban, Timer } from "lucide-react";
import { PROJECT_LABELS } from "@/lib/utils";

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

const CHART_HEIGHT = 96;
const MAX_PROJECT = 24;

const cardClass = "bg-zinc-900 border border-zinc-800 rounded-xl p-4";
const headingClass =
  "font-display text-sm font-600 text-zinc-300 flex items-center gap-1.5";

function NoData() {
  return (
    <p className="py-6 text-center text-sm text-zinc-600">No data yet</p>
  );
}

function formatResolution(hours: number | null): string {
  if (hours === null || Number.isNaN(hours)) return "—";
  if (hours >= 24) return `${(hours / 24).toFixed(1)} days`;
  return `${Math.round(hours)} h`;
}

/** Parses a YYYY-MM-DD key without timezone drift. */
function dayParts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

function fullDate(date: string) {
  const { y, m, d } = dayParts(date);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tickLabel(date: string) {
  const { m, d } = dayParts(date);
  return `${m}/${d}`;
}

function TrendChart({ trend }: { trend: AdminStats["trend"] }) {
  const max = Math.max(1, ...trend.map((t) => Math.max(t.created, t.resolved)));
  const hasData = trend.some((t) => t.created > 0 || t.resolved > 0);

  if (!hasData) {
    return (
      <div className={cardClass}>
        <h3 className={`${headingClass} mb-2`}>
          <Activity size={14} className="text-indigo-400" />
          Activity
        </h3>
        <NoData />
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className={headingClass}>
          <Activity size={14} className="text-indigo-400" />
          Activity
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-indigo-500" />
            created
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-500" />
            resolved
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[540px]">
          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-600">
            <span>peak {max}</span>
            <span>last 30 days</span>
          </div>
          <div className="flex items-end gap-1 border-b border-zinc-800 pb-1">
            {trend.map((day, i) => {
              const created = Math.round((day.created / max) * CHART_HEIGHT);
              const resolved = Math.round((day.resolved / max) * CHART_HEIGHT);
              const showTick = i % 5 === 0 || i === trend.length - 1;
              return (
                <div
                  key={day.date}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  title={`${fullDate(day.date)} · ${day.created} created · ${day.resolved} resolved`}
                >
                  <div
                    className="flex items-end justify-center gap-[2px]"
                    style={{ height: CHART_HEIGHT }}
                  >
                    <div
                      className="w-1.5 rounded-t-sm bg-indigo-500"
                      style={{ height: created }}
                    />
                    <div
                      className="w-1.5 rounded-t-sm bg-emerald-500"
                      style={{ height: resolved }}
                    />
                  </div>
                  <span className="h-3 text-[9px] leading-3 text-zinc-600">
                    {showTick ? tickLabel(day.date) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectBars({ byProject }: { byProject: AdminStats["byProject"] }) {
  const rows = byProject.slice(0, MAX_PROJECT);
  const max = Math.max(1, ...rows.map((p) => p.total));

  return (
    <div className={cardClass}>
      <h3 className={`${headingClass} mb-3`}>
        <FolderKanban size={14} className="text-indigo-400" />
        By project
      </h3>
      {rows.length === 0 ? (
        <NoData />
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => {
            const openPct = row.total > 0 ? (row.open / row.total) * 100 : 0;
            return (
              <div key={row.project}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="truncate text-zinc-400">
                    {PROJECT_LABELS[row.project] ?? row.project}
                  </span>
                  <span className="shrink-0 text-zinc-600 tabular-nums">
                    {row.open} open · {row.total}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-zinc-800"
                  style={{ width: `${(row.total / max) * 100}%` }}
                >
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${openPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResolutionCard({ stats }: { stats: AdminStats }) {
  return (
    <div className={cardClass}>
      <h3 className={`${headingClass} mb-3`}>
        <Timer size={14} className="text-indigo-400" />
        Resolution
      </h3>
      <div className="flex items-end gap-1">
        <span className="font-display text-2xl font-700 text-zinc-100">
          {formatResolution(stats.avgResolutionHours)}
        </span>
        <span className="pb-1 text-xs text-zinc-500">avg time</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
        <span className="text-zinc-500">Overdue</span>
        <span className="font-600 text-amber-400 tabular-nums">
          {stats.overdue}
        </span>
      </div>
    </div>
  );
}

export default function StatsCharts({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart trend={stats.trend ?? []} />
        </div>
        <ResolutionCard stats={stats} />
      </div>
      <ProjectBars byProject={stats.byProject ?? []} />
    </div>
  );
}
