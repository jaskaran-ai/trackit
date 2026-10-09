import Navbar from "@/components/shared/Navbar";

function StatCardSkeleton() {
  return (
    <div className="rounded-panel border border-border bg-surface p-4">
      <div className="skeleton mb-1 h-7 w-12" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

function SubmissionCardSkeleton() {
  return (
    <div className="space-y-3 rounded-panel border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-5 w-14 shrink-0" />
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-10" />
        <div className="skeleton h-5 w-14" />
      </div>
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-3 w-8" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-busy="true">
        <div className="mb-8 flex items-start justify-between">
          <div className="space-y-2">
            <div className="skeleton h-7 w-40" />
            <div className="skeleton h-4 w-32" />
          </div>
          <div className="skeleton h-9 w-32" />
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SubmissionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}