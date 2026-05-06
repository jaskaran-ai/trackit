import Navbar from "@/components/shared/Navbar";

export default function SubmitLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <div className="w-32 h-4 rounded bg-zinc-800 animate-pulse mb-6" />

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2 mb-8">
            <div className="w-40 h-7 rounded bg-zinc-800 animate-pulse" />
            <div className="w-56 h-4 rounded bg-zinc-800 animate-pulse" />
          </div>

          {/* Type toggle */}
          <div className="space-y-2">
            <div className="w-8 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="flex gap-2">
              <div className="w-28 h-10 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="w-32 h-10 rounded-lg bg-zinc-800 animate-pulse" />
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-2">
            <div className="w-24 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="w-full h-12 rounded-xl bg-zinc-800 animate-pulse" />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <div className="w-14 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-16 h-7 rounded-lg bg-zinc-800 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <div className="w-12 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-20 h-7 rounded-lg bg-zinc-800 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="w-20 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="w-full h-40 rounded-xl bg-zinc-800 animate-pulse" />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="w-16 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="w-full h-24 rounded-xl bg-zinc-800 animate-pulse" />
          </div>

          {/* Submit button */}
          <div className="w-full h-12 rounded-xl bg-zinc-800 animate-pulse" />
        </div>
      </main>
    </div>
  );
}
