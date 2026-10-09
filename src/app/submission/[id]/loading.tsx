import Navbar from "@/components/shared/Navbar";
import { PanelSkeleton } from "@/components/shared/loading-skeletons";

export default function SubmissionDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-5">
        <div className="mb-3 rounded-panel border border-border bg-surface p-5">
          <PanelSkeleton lines={4} label="Loading submission" />
        </div>
        <div className="rounded-panel border border-border bg-surface p-5">
          <PanelSkeleton lines={5} label="Loading details" />
        </div>
      </main>
    </div>
  );
}
