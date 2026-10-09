"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/arc/button/button";
import { Select } from "@/components/arc/select/select";
import { DatePicker } from "@/components/arc/date-picker/date-picker";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import {
  PRIORITIES,
  SUBMISSION_STATUSES,
  type Priority,
  type Submission,
  type SubmissionStatus,
} from "@/db/types";

/** A `Date` for the picker, from the stored timestamp. */
function toDate(value: Date | string | null): Date | undefined {
  return value ? new Date(value) : undefined;
}

/** A `yyyy-mm-dd` string to post, built from local parts. */
function toDateInputValue(date: Date | undefined): string | null {
  if (!date) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function AdminStatusControls({
  submission,
}: {
  submission: Submission;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SubmissionStatus>(submission.status);
  const [priority, setPriority] = useState<Priority>(submission.priority);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    toDate(submission.dueDate),
  );
  const [saving, setSaving] = useState(false);

  const initialDue = toDateInputValue(toDate(submission.dueDate));
  const nextDue = toDateInputValue(dueDate);
  const isDirty =
    status !== submission.status ||
    priority !== submission.priority ||
    nextDue !== initialDue;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          /* Local calendar day, not an instant: the old code sent midnight UTC,
             which moved the due date back a day for anyone east of Greenwich. */
          dueDate: nextDue ? new Date(`${nextDue}T00:00:00`).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Submission updated");
      router.refresh();
    } catch {
      toast.error("Could not update the submission");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Submission deleted");
      router.push("/admin");
    } catch {
      toast.error("Could not delete the submission");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Status"
          value={status}
          onValueChange={(next) => setStatus(next as SubmissionStatus)}
          options={SUBMISSION_STATUSES.map((value) => ({
            value,
            label: STATUS_LABELS[value],
          }))}
        />
        <Select
          label="Priority"
          value={priority}
          onValueChange={(next) => setPriority(next as Priority)}
          options={PRIORITIES.map((value) => ({
            value,
            label: PRIORITY_LABELS[value],
          }))}
        />
      </div>

      <DatePicker
        label="Due date"
        value={dueDate}
        onChange={setDueDate}
        placeholder="No due date"
      />

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          loading={saving}
          disabled={!isDirty}
        >
          Save changes
        </Button>

        {/*
          Hard delete is irreversible, so it confirms with a countdown rather
          than a second click. The old version asked by changing its own label
          and armed for three seconds, which a fast double click could beat.
        */}
        <ConfirmMorph
          className="ml-auto"
          confirmMode="countdown"
          countdown={5}
          tone="danger"
          icon={<Trash2 size={12} aria-hidden />}
          label="Delete"
          prompt="Delete this submission?"
          confirmLabel="Delete"
          pendingLabel="Deleting"
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}