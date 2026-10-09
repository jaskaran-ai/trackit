"use client";

import {
  BugIcon,
  LayersIcon,
  LightbulbIcon,
} from "@animateicons/react/lucide";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import MetricStatCard from "@/components/shared/MetricStatCard";
import { useDashboardSummary } from "@/hooks/use-dashboard-data";

/**
 * One summary request drives every card. Until it lands the grid shows a single
 * skeleton shell rather than four independent count spinners.
 */
export default function DashboardMetricsSection() {
  const { data: summary, isPending } = useDashboardSummary();

  return (
    <Skeleton
      loading={isPending && !summary}
      lines={2}
      label="Loading metrics"
    >
      {summary ? (
        <div className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
          <MetricStatCard
            icon={LayersIcon}
            label="Total"
            value={summary.total}
            context={`${summary.open} in progress`}
          />
          <MetricStatCard
            icon={BugIcon}
            tone="danger"
            label="Bugs"
            value={summary.bugs}
            context="Reported by you"
          />
          <MetricStatCard
            icon={LightbulbIcon}
            tone="accent"
            label="Features"
            value={summary.features}
            context="Reported by you"
          />
        </div>
      ) : null}
    </Skeleton>
  );
}
