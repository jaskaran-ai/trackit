"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Submission } from "@/db/types";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "REVIEW", "COMPLETE", "CANCELED"] as const;
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

/** Local (not UTC) YYYY-MM-DD for a date input's value. */
function toDateInputValue(value: Date | string): string {
  const d = new Date(value);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETE: "Complete",
  CANCELED: "Canceled",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  IN_PROGRESS: "bg-amber-500/15 border-amber-500/40 text-amber-300",
  REVIEW: "bg-violet-500/15 border-violet-500/40 text-violet-300",
  COMPLETE: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  CANCELED: "bg-zinc-500/15 border-zinc-500/40 text-zinc-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export default function AdminStatusControls({
  submission,
}: {
  submission: Submission;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(submission.status);
  const [priority, setPriority] = useState(submission.priority);
  const [dueDate, setDueDate] = useState(
    submission.dueDate ? toDateInputValue(submission.dueDate) : ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initialDue = submission.dueDate ? toDateInputValue(submission.dueDate) : "";
  const isDirty =
    status !== submission.status ||
    priority !== submission.priority ||
    dueDate !== initialDue;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Submission updated");
      router.refresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Submission deleted");
      router.push("/admin");
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div>
          <label className="block text-xs font-500 text-zinc-500 mb-1.5">Status</label>
          <div className="flex flex-col gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "text-left px-3 py-1.5 rounded-lg text-xs font-500 border transition-all cursor-pointer",
                  status === s
                    ? STATUS_COLORS[s]
                    : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-500 text-zinc-500 mb-1.5">Priority</label>
          <div className="flex flex-col gap-1">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "text-left px-3 py-1.5 rounded-lg text-xs font-500 border transition-all cursor-pointer",
                  priority === p
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                )}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div className="flex flex-col">
          <label className="block text-xs font-500 text-zinc-500 mb-1.5">Due date</label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/60 transition-colors [color-scheme:dark]"
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate("")}
                aria-label="Clear due date"
                className="shrink-0 cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-500 transition-all",
            isDirty && !saving
              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          )}
        >
          {saving ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={12} />
          )}
          {saving ? "Saving…" : "Save changes"}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-500 border transition-all ml-auto",
            confirmDelete
              ? "bg-red-500 border-red-600 text-white"
              : "bg-transparent border-zinc-700 text-zinc-500 hover:border-red-500/50 hover:text-red-400"
          )}
        >
          {deleting ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
          {confirmDelete ? "Click again to confirm" : deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
