"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, LayoutGrid, Table2 } from "lucide-react";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";

/**
 * Two views of the same records, so this is a segmented control rather than
 * tabs: nothing below the control changes shape, only how the rows are laid out.
 */
export default function AdminViewToggle({
  tableView,
  kanbanView,
}: {
  tableView: React.ReactNode;
  kanbanView: React.ReactNode;
}) {
  const [view, setView] = useState("table");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/admin/archived"
          className="inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Archive size={13} aria-hidden />
          Archived
        </Link>

        <SegmentedControl
          label="View"
          value={view}
          onValueChange={setView}
          options={[
            {
              value: "table",
              label: "Table",
              accessory: <Table2 size={13} aria-hidden className="ml-1.5 inline" />,
            },
            {
              value: "kanban",
              label: "Board",
              accessory: <LayoutGrid size={13} aria-hidden className="ml-1.5 inline" />,
            },
          ]}
        />
      </div>

      {/* Both views stay mounted so a filter or sort applied in one survives the
          switch. The hidden one is removed from the tab order and the
          accessibility tree rather than being unmounted. */}
      <div hidden={view !== "table"}>{tableView}</div>
      <div hidden={view !== "kanban"}>{kanbanView}</div>
    </div>
  );
}