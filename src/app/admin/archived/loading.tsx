import Navbar from "@/components/shared/Navbar";
import { PanelSkeleton } from "@/components/shared/loading-skeletons";

export default function ArchivedLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-5">
        <div className="mb-5 rounded-panel border border-border bg-surface p-4 sm:p-5">
          <PanelSkeleton lines={2} label="Loading archived submissions" />
        </div>
      </main>
    </div>
  );
}
