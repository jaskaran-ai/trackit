"use client";

import { Skeleton } from "@/components/arc/skeleton/skeleton";

export function MetricCardsSkeleton({
  count = 3,
  className = "mb-5 grid grid-cols-3 gap-2.5 sm:gap-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-surface)] border border-border bg-surface p-3"
        >
          <Skeleton lines={2} label="Loading metric" />
        </div>
      ))}
    </div>
  );
}

export function SubmissionCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <div className="mb-3 rounded-panel border border-border bg-surface p-3 sm:p-3.5">
        <Skeleton lines={2} label="Loading filters" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-panel border border-border bg-surface p-3.5 sm:p-4"
          >
            <Skeleton lines={3} label="Loading submission" />
          </div>
        ))}
      </div>
    </>
  );
}

export function PanelSkeleton({
  lines = 3,
  label = "Loading",
  className,
}: {
  lines?: number;
  label?: string;
  className?: string;
}) {
  return <Skeleton lines={lines} label={label} className={className} />;
}
