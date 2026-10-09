import Navbar from "@/components/shared/Navbar";
import {
  MetricCardsSkeleton,
  PanelSkeleton,
} from "@/components/shared/loading-skeletons";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6" aria-busy="true">
        <MetricCardsSkeleton
          count={6}
          className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6"
        />
        <div className="rounded-panel border border-border bg-surface p-4 sm:p-5">
          <PanelSkeleton lines={5} label="Loading submissions" />
        </div>
      </main>
    </div>
  );
}
