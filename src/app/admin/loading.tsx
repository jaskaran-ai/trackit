import Navbar from "@/components/shared/Navbar";

function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4">
      <div className="w-8 h-7 rounded bg-zinc-800 animate-pulse mb-0.5" />
      <div className="w-14 h-3 rounded bg-zinc-800 animate-pulse" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-zinc-800/60">
      <td className="px-4 py-3"><div className="w-full max-w-[200px] h-4 rounded bg-zinc-800 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="w-12 h-5 rounded bg-zinc-800 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="w-16 h-5 rounded bg-zinc-800 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="w-14 h-5 rounded bg-zinc-800 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="w-20 h-3 rounded bg-zinc-800 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="w-20 h-5 rounded bg-zinc-800 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="w-20 h-4 rounded bg-zinc-800 animate-pulse" /></td>
      <td className="px-4 py-3"><div className="w-8 h-3 rounded bg-zinc-800 animate-pulse" /></td>
    </tr>
  );
}

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="w-48 h-7 rounded bg-zinc-800 animate-pulse" />
          <div className="w-56 h-4 rounded bg-zinc-800 animate-pulse" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-zinc-800 flex flex-wrap gap-2">
            <div className="flex-1 min-w-[180px] h-8 rounded-lg bg-zinc-800 animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-28 h-8 rounded-lg bg-zinc-800 animate-pulse" />
            ))}
          </div>

          {/* Count */}
          <div className="px-4 py-2 border-b border-zinc-800/50">
            <div className="w-24 h-3 rounded bg-zinc-800 animate-pulse" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Title", "Type", "Priority", "Status", "Date", "Project", "Reporter", ""].map((label) => (
                    <th key={label} className="text-left px-4 py-2.5 whitespace-nowrap">
                      <div className="w-12 h-3 rounded bg-zinc-800 animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
