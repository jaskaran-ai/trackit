import Navbar from "@/components/shared/Navbar";

export default function SubmissionDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-3 sm:px-5 py-6">
        {/* Back link */}
        <div className="w-32 h-4 skeleton mb-5" />

        {/* Header card */}
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl p-5 mb-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="w-full h-6 skeleton" />
            <div className="w-14 h-6 skeleton shrink-0" />
          </div>

          <div className="flex gap-2">
            <div className="w-10 h-5 skeleton" />
            <div className="w-14 h-5 skeleton" />
          </div>

          <div className="flex items-center gap-2.5 pt-4 border-t border-[var(--border-subtle)]">
            <div className="w-7 h-7 skeleton rounded-pill" />
            <div className="space-y-1">
              <div className="w-24 h-3 skeleton" />
              <div className="w-32 h-3 skeleton" />
            </div>
          </div>
        </div>

        {/* Description card */}
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl p-5 mb-3 space-y-3">
          <div className="w-20 h-4 skeleton" />
          <div className="space-y-2">
            <div className="w-full h-3 skeleton" />
            <div className="w-5/6 h-3 skeleton" />
            <div className="w-4/6 h-3 skeleton" />
            <div className="w-full h-3 skeleton" />
            <div className="w-3/4 h-3 skeleton" />
          </div>
        </div>

        {/* Attachments card */}
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl p-5 space-y-2.5">
          <div className="w-32 h-4 skeleton" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-surface border border-[var(--border-subtle)] rounded-control px-2.5 py-2">
              <div className="w-8 h-8 rounded-md skeleton shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="w-32 h-3 skeleton" />
                <div className="w-16 h-3 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
