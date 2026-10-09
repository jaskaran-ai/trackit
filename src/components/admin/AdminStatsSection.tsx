"use client";

import {
  BugIcon,
  CircleDotIcon,
  ClipboardCheckIcon,
  LayersIcon,
  LoaderIcon,
  UsersIcon,
} from "@animateicons/react/lucide";
import StatsCharts from "@/components/admin/StatsCharts";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import MetricStatCard from "@/components/shared/MetricStatCard";
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
            <MetricStatCard
              icon={LayersIcon}
              label="Total"
              value={stats.total}
              context="All time"
            />
            <MetricStatCard
              icon={CircleDotIcon}
              tone="warning"
              label="Open"
              value={stats.byStatus.open}
              context="Awaiting triage"
            />
            <MetricStatCard
              icon={LoaderIcon}
              tone="accent"
              label="In progress"
              value={stats.byStatus.inProgress}
              context="Being worked on"
            />
            <MetricStatCard
              icon={ClipboardCheckIcon}
              tone="success"
              label="In review"
              value={stats.byStatus.review}
              context="Awaiting sign-off"
            />
            <MetricStatCard
              icon={BugIcon}
              tone="danger"
              label="Bugs"
              value={stats.byType.bugs}
              context={`${stats.byType.features} feature requests`}
            />
            <MetricStatCard
              icon={UsersIcon}
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
