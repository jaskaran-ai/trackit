import Navbar from "@/components/shared/Navbar";

function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="w-12 h-7 rounded bg-zinc-800 animate-pulse mb-0.5" />
      <div className="w-16 h-3 rounded bg-zinc-800 animate-pulse" />
    </div>
  );
}

function SubmissionCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full h-4 rounded bg-zinc-800 animate-pulse" />
        <div className="w-14 h-5 rounded bg-zinc-800 animate-pulse shrink-0" />
      </div>
      <div className="flex gap-1.5">
        <div className="w-10 h-5 rounded bg-zinc-800 animate-pulse" />
        <div className="w-14 h-5 rounded bg-zinc-800 animate-pulse" />
      </div>
      <div className="flex items-center justify-between">
        <div className="w-20 h-3 rounded bg-zinc-800 animate-pulse" />
        <div className="w-8 h-3 rounded bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <div className="w-40 h-7 rounded bg-zinc-800 animate-pulse" />
            <div className="w-32 h-4 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="w-32 h-9 rounded-lg bg-zinc-800 animate-pulse" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Submission grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SubmissionCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
