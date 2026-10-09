import Navbar from "@/components/shared/Navbar";

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-3 sm:p-4">
      <div className="w-8 h-7 skeleton mb-0.5" />
      <div className="w-14 h-3 skeleton" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-[var(--border-subtle)]/60">
      <td className="px-4 py-3"><div className="w-full max-w-[200px] h-4 skeleton" /></td>
      <td className="px-4 py-3"><div className="w-12 h-5 skeleton" /></td>
      <td className="px-4 py-3"><div className="w-16 h-5 skeleton" /></td>
      <td className="px-4 py-3"><div className="w-14 h-5 skeleton" /></td>
      <td className="px-4 py-3"><div className="w-20 h-3 skeleton" /></td>
      <td className="px-4 py-3"><div className="w-20 h-5 skeleton" /></td>
      <td className="px-4 py-3"><div className="w-20 h-4 skeleton" /></td>
      <td className="px-4 py-3"><div className="w-8 h-3 skeleton" /></td>
    </tr>
  );
}

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="w-48 h-7 skeleton" />
          <div className="w-56 h-4 skeleton" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-surface border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap gap-2">
            <div className="flex-1 min-w-[180px] h-8 rounded-control skeleton" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-28 h-8 rounded-control skeleton" />
            ))}
          </div>

          {/* Count */}
          <div className="px-4 py-2 border-b border-[var(--border-subtle)]/50">
            <div className="w-24 h-3 skeleton" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Title", "Type", "Priority", "Status", "Date", "Project", "Reporter", ""].map((label) => (
                    <th key={label} className="text-left px-4 py-2.5 whitespace-nowrap">
                      <div className="w-12 h-3 skeleton" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]/60">
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
