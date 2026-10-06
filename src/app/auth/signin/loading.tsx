export default function SignInLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="space-y-16 relative z-10">
          <div className="w-52 h-10 rounded bg-zinc-800 animate-pulse" />

          <div className="space-y-4">
            <div className="w-64 h-10 rounded bg-zinc-800 animate-pulse" />
            <div className="w-72 h-5 rounded bg-zinc-800 animate-pulse" />
            <div className="w-48 h-5 rounded bg-zinc-800 animate-pulse" />
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="w-24 h-4 rounded bg-zinc-800 animate-pulse" />
                <div className="w-40 h-3 rounded bg-zinc-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="w-44 h-9 rounded bg-zinc-800 animate-pulse mb-10 lg:hidden" />

          <div className="space-y-2 mb-8">
            <div className="w-32 h-7 rounded bg-zinc-800 animate-pulse" />
            <div className="w-48 h-4 rounded bg-zinc-800 animate-pulse" />
          </div>

          <div className="w-full h-12 rounded-xl bg-zinc-800 animate-pulse" />

          <div className="w-40 h-3 rounded bg-zinc-800 animate-pulse mx-auto mt-6" />
        </div>
      </div>
    </div>
  );
}
