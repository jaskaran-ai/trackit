export default function SignInLoading() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface relative overflow-hidden flex-col justify-between p-12">
        <div className="space-y-16 relative z-10">
          <div className="w-52 h-10 skeleton" />

          <div className="space-y-4">
            <div className="w-64 h-10 skeleton" />
            <div className="w-72 h-5 skeleton" />
            <div className="w-48 h-5 skeleton" />
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-control skeleton shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="w-24 h-4 skeleton" />
                <div className="w-40 h-3 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="w-44 h-9 skeleton mb-10 lg:hidden" />

          <div className="space-y-2 mb-8">
            <div className="w-32 h-7 skeleton" />
            <div className="w-48 h-4 skeleton" />
          </div>

          <div className="w-full h-12 rounded-panel skeleton" />

          <div className="w-40 h-3 skeleton mx-auto mt-6" />
        </div>
      </div>
    </div>
  );
}
