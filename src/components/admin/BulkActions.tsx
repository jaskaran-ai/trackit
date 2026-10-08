"use client";

import { useState } from "react";
import { Archive, Trash2, X } from "lucide-react";
import { cn, STATUS_LABELS } from "@/lib/utils";
import type { SubmissionStatus } from "@/db/types";

export type BulkAction = "status" | "priority" | "archive" | "restore" | "delete";

const STATUS_OPTIONS: SubmissionStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETE",
  "CANCELED",
];

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

/**
 * The admin bulk-actions bar. Shown only when rows are selected. All mutations
 * go through `onDispatch`; the parent owns the optimistic update + revert.
 */
export default function BulkActions({
  count,
  onDispatch,
  onClear,
}: {
  count: number;
  onDispatch: (action: BulkAction, value?: string) => void | Promise<void>;
  onClear: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectClass =
    "cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none transition-colors focus:border-indigo-500/60";

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setConfirmDelete(false);
    void onDispatch("delete");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-indigo-500/5 px-4 py-2.5">
      <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-600 text-indigo-300">
        {count} selected
      </span>

      <select
        value=""
        onChange={(e) => {
          if (e.target.value) void onDispatch("status", e.target.value);
        }}
        className={selectClass}
        aria-label="Set status"
      >
        <option value="">Set status…</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value=""
        onChange={(e) => {
          if (e.target.value) void onDispatch("priority", e.target.value);
        }}
        className={selectClass}
        aria-label="Set priority"
      >
        <option value="">Set priority…</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => void onDispatch("archive")}
        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
      >
        <Archive size={12} />
        Archive
      </button>

      <button
        type="button"
        onClick={handleDelete}
        onBlur={() => setConfirmDelete(false)}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-500 transition-all",
          confirmDelete
            ? "cursor-pointer border-red-600 bg-red-500 text-white"
            : "cursor-pointer border-zinc-700 bg-transparent text-zinc-400 hover:border-red-500/50 hover:text-red-400"
        )}
      >
        <Trash2 size={12} />
        {confirmDelete ? "Delete forever?" : "Delete"}
      </button>

      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <X size={12} />
        Cancel
      </button>
    </div>
  );
}
