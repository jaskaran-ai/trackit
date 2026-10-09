import Navbar from "@/components/shared/Navbar";
import {
  MetricCardsSkeleton,
  PanelSkeleton,
} from "@/components/shared/loading-skeletons";

/** Route-level shell: navbar plus metric and panel skeleton layout. */
export function RouteLoadingShell({
  mainClassName = "mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6",
}: {
  mainClassName?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={mainClassName} aria-busy="true">
        <MetricCardsSkeleton count={3} />
        <div className="rounded-panel border border-border bg-surface p-4 sm:p-5">
          <PanelSkeleton lines={5} label="Loading content" />
        </div>
      </main>
    </div>
  );
}
