import Navbar from "@/components/shared/Navbar";
import { PanelSkeleton } from "@/components/shared/loading-skeletons";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-5">
        <div className="space-y-4">
          <div className="rounded-panel border border-border bg-surface p-4 sm:p-5">
            <PanelSkeleton lines={4} label="Loading settings" />
          </div>
        </div>
      </main>
    </div>
  );
}
