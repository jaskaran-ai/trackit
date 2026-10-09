"use client";

import StatsCharts from "@/components/admin/StatsCharts";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { useAdminStats } from "@/hooks/use-admin-data";

/**
 * The KPI row plus the charts. Both read the same stats payload, so this
 * section owns the fetch and the charts keep taking plain props.
 */
export default function AdminStatsSection() {
  const { data: stats } = useAdminStats();

  return (
    <>
      <Skeleton loading={!stats} lines={2} label="Loading metrics">
        {stats ? (
          <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6">
            <MetricCard label="Total" value={stats.total} context="All time" />
            <MetricCard
              label="Open"
              value={stats.byStatus.open}
              context="Awaiting triage"
            />
            <MetricCard
              label="In progress"
              value={stats.byStatus.inProgress}
              context="Being worked on"
            />
            <MetricCard
              label="In review"
              value={stats.byStatus.review}
              context="Awaiting sign-off"
            />
            <MetricCard
              label="Bugs"
              value={stats.byType.bugs}
              context={`${stats.byType.features} feature requests`}
            />
            <MetricCard
              label="Users"
              value={stats.users}
              context={`${stats.archived} archived`}
            />
          </div>
        ) : null}
      </Skeleton>
      {stats ? (
        <div className="mb-2">
          <StatsCharts stats={stats} />
        </div>
      ) : null}
    </>
  );
}
