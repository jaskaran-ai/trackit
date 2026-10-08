import Navbar from "@/components/shared/Navbar";

function RowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="w-7 h-7 rounded-lg bg-zinc-800 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-2/3 h-4 rounded bg-zinc-800 animate-pulse" />
        <div className="w-1/2 h-3 rounded bg-zinc-800 animate-pulse" />
        <div className="w-28 h-2.5 rounded bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}

export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="w-40 h-7 rounded bg-zinc-800 animate-pulse" />
          <div className="w-64 h-4 rounded bg-zinc-800 animate-pulse" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-800">
              <div className="w-16 h-8 rounded-md bg-zinc-800 animate-pulse" />
              <div className="w-20 h-8 rounded-md bg-zinc-800 animate-pulse" />
            </div>
            <div className="w-28 h-8 rounded-lg bg-zinc-800 animate-pulse ml-auto" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
