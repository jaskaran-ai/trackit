import Navbar from "@/components/shared/Navbar";

function CardSkeleton() {
  return (
    <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-5 sm:p-6 space-y-5">
      <div className="w-20 h-3 skeleton" />
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 skeleton rounded-pill shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="w-40 h-4 skeleton" />
          <div className="w-56 h-3 skeleton" />
        </div>
      </div>
      <div className="pt-5 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="w-12 h-3 skeleton" />
          <div className="w-20 h-4 skeleton" />
        </div>
        <div className="space-y-2">
          <div className="w-20 h-3 skeleton" />
          <div className="w-24 h-4 skeleton" />
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="w-7 h-7 rounded-control skeleton shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-2/3 h-4 skeleton" />
        <div className="w-1/2 h-3 skeleton" />
        <div className="w-28 h-2.5 skeleton" />
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="w-28 h-7 skeleton" />
          <div className="w-64 h-4 skeleton" />
        </div>

        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />

          {/* Notification rows stand in for the preferences form */}
          <div className="bg-surface border border-[var(--border-subtle)] rounded-panel overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[var(--border-subtle)]">
              <div className="w-40 h-8 rounded-control skeleton" />
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
