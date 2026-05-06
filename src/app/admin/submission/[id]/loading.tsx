import Navbar from "@/components/shared/Navbar";

export default function AdminSubmissionDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <div className="w-32 h-4 rounded bg-zinc-800 animate-pulse mb-6" />

        <div className="space-y-4">
          {/* Header card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full h-6 rounded bg-zinc-800 animate-pulse" />
              <div className="w-14 h-6 rounded bg-zinc-800 animate-pulse shrink-0" />
            </div>

            <div className="flex gap-2">
              <div className="w-10 h-5 rounded bg-zinc-800 animate-pulse" />
              <div className="w-14 h-5 rounded bg-zinc-800 animate-pulse" />
            </div>

            {/* Reporter info */}
            <div className="flex items-center gap-3 py-4 border-t border-b border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
              <div className="space-y-1">
                <div className="w-24 h-4 rounded bg-zinc-800 animate-pulse" />
                <div className="w-32 h-3 rounded bg-zinc-800 animate-pulse" />
              </div>
              <div className="ml-auto w-24 h-3 rounded bg-zinc-800 animate-pulse" />
            </div>

            {/* Admin controls */}
            <div className="flex gap-2">
              <div className="w-20 h-8 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="w-20 h-8 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="w-20 h-8 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="w-20 h-8 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="w-20 h-8 rounded-lg bg-zinc-800 animate-pulse" />
            </div>
          </div>

          {/* Description card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="w-20 h-4 rounded bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="w-full h-3 rounded bg-zinc-800 animate-pulse" />
              <div className="w-5/6 h-3 rounded bg-zinc-800 animate-pulse" />
              <div className="w-4/6 h-3 rounded bg-zinc-800 animate-pulse" />
              <div className="w-full h-3 rounded bg-zinc-800 animate-pulse" />
              <div className="w-3/4 h-3 rounded bg-zinc-800 animate-pulse" />
            </div>
          </div>

          {/* Attachments card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <div className="w-32 h-4 rounded bg-zinc-800 animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-md bg-zinc-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="w-32 h-3 rounded bg-zinc-800 animate-pulse" />
                  <div className="w-16 h-3 rounded bg-zinc-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
