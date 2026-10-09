import Navbar from "@/components/shared/Navbar";

function RowSkeleton() {
  return (
    <div className="flex items-start gap-2.5 px-2.5 py-2">
      <div className="w-7 h-7 rounded-control skeleton shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-2/3 h-4 skeleton" />
        <div className="w-1/2 h-3 skeleton" />
        <div className="w-28 h-2.5 skeleton" />
      </div>
    </div>
  );
}

export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-3 sm:px-5 py-6">
        {/* Header */}
        <div className="mb-5 space-y-2">
          <div className="w-40 h-7 skeleton" />
          <div className="w-64 h-4 skeleton" />
        </div>

        <div className="bg-surface border border-[var(--border-subtle)] rounded-panel overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-0.5 p-0.5 rounded-control bg-surface-muted">
              <div className="w-16 h-8 rounded-md skeleton" />
              <div className="w-20 h-8 rounded-md skeleton" />
            </div>
            <div className="w-28 h-8 rounded-control skeleton ml-auto" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
