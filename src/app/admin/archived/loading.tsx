import Navbar from "@/components/shared/Navbar";

export default function ArchivedLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-3 sm:px-5 py-6">
        <div className="mb-5 space-y-2">
          <div className="h-5 w-40 skeleton" />
          <div className="h-7 w-48 skeleton" />
        </div>

        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-3 py-2">
            <div className="h-3 w-28 skeleton" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2.5 border-b border-[var(--border-subtle)]/60 px-3 py-3 last:border-b-0"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 max-w-xs skeleton" />
                <div className="h-4 w-40 skeleton" />
              </div>
              <div className="h-7 w-32 rounded-control skeleton" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
