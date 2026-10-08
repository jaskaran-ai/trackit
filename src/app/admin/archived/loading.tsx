import Navbar from "@/components/shared/Navbar";

export default function ArchivedLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 space-y-2">
          <div className="h-5 w-40 rounded bg-zinc-800 animate-pulse" />
          <div className="h-7 w-48 rounded bg-zinc-800 animate-pulse" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="border-b border-zinc-800 px-4 py-2.5">
            <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 border-b border-zinc-800/60 px-4 py-4 last:border-b-0"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 max-w-xs rounded bg-zinc-800 animate-pulse" />
                <div className="h-4 w-40 rounded bg-zinc-800 animate-pulse" />
              </div>
              <div className="h-7 w-32 rounded-lg bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
