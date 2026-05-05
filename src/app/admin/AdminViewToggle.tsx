"use client";

import { useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminViewToggle({
  tableView,
  kanbanView,
}: {
  tableView: React.ReactNode;
  kanbanView: React.ReactNode;
}) {
  const [view, setView] = useState<"table" | "kanban">("table");

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-500 transition-all",
              view === "table"
                ? "bg-zinc-700 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Table2 size={13} />
            Table
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-500 transition-all",
              view === "kanban"
                ? "bg-zinc-700 text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <LayoutGrid size={13} />
            Kanban
          </button>
        </div>
      </div>

      {view === "table" ? tableView : kanbanView}
    </div>
  );
}
