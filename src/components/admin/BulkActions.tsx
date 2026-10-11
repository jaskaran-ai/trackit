"use client";

import { Archive, Trash2 } from "lucide-react";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import { Select } from "@/components/arc/select/select";
import { Button } from "@/components/arc/button/button";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { PRIORITIES, SUBMISSION_STATUSES } from "@/db/types";

export type BulkAction = "status" | "priority" | "archive" | "restore" | "delete";

const NONE = "";

/** Every control in the bar is this tall, so triggers, buttons, and the count pill share one line. */
const CONTROL_ROW = "flex h-[var(--control-height-md)] items-center";

/**
 * The admin bulk-actions bar. Shown only while rows are selected. All mutations
 * go through `onDispatch`; the parent owns the optimistic update and the revert.
 *
 * Delete is `confirm-morph` rather than a button that arms itself on the first
 * click. The old version disarmed on blur, so tabbing away silently undid a
 * confirmation someone had just given, and the armed state was the only warning
 * that a second click was not what it looked like. Confirm-morph asks its
 * question inline and runs on the answer.
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
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-[var(--border-subtle)] bg-accent-subtle px-3 py-2">
      <div className={CONTROL_ROW}>
        <span className="rounded-control bg-accent-subtle px-2 py-0.5 text-xs font-500 text-accent">
          {count} selected
        </span>
      </div>

      <Select
        label="Status"
        placeholder="Set status"
        className="min-w-36"
        value={NONE}
        onValueChange={(next) => {
          if (next) void onDispatch("status", next);
        }}
        options={SUBMISSION_STATUSES.map((value) => ({
          value,
          label: STATUS_LABELS[value],
        }))}
      />

      <Select
        label="Priority"
        placeholder="Set priority"
        className="min-w-36"
        value={NONE}
        onValueChange={(next) => {
          if (next) void onDispatch("priority", next);
        }}
        options={PRIORITIES.map((value) => ({
          value,
          label: PRIORITY_LABELS[value],
        }))}
      />

      <Button
        variant="secondary"
        size="md"
        onClick={() => void onDispatch("archive")}
      >
        <Archive size={12} aria-hidden />
        Archive
      </Button>

      <div className={CONTROL_ROW}>
        <ConfirmMorph
          className="text-sm"
          icon={<Trash2 size={12} aria-hidden />}
          label="Delete"
          prompt={`Delete ${count} submission${count === 1 ? "" : "s"}?`}
          confirmLabel="Delete"
          pendingLabel="Deleting"
          onConfirm={() => onDispatch("delete")}
        />
      </div>

      <Button variant="ghost" size="md" className="ml-auto" onClick={onClear}>
        Cancel
      </Button>
    </div>
  );
}
