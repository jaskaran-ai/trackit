"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Trash2, Inbox } from "lucide-react";
import { StatusBadge, TypeBadge, ProjectBadge } from "@/components/shared/Badges";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { SubmissionWithUser } from "@/types";
import {
  useArchivedSubmissions,
  useDeleteArchivedSubmission,
  useRestoreArchivedSubmission,
} from "@/hooks/use-archived-submissions";

function ArchivedRow({
  submission,
  busy,
  confirming,
  onRestore,
  onRequestDelete,
  onConfirmDelete,
}: {
  submission: SubmissionWithUser;
  busy: boolean;
  confirming: boolean;
  onRestore: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const archivedDate = submission.deletedAt ?? submission.updatedAt;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-zinc-800/30">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200">{submission.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={submission.status} />
          <TypeBadge type={submission.type} />
          <ProjectBadge project={submission.project} />
          <span className="text-[11px] text-zinc-600">
            archived {formatDate(archivedDate)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {submission.user.image ? (
            <img
              src={submission.user.image}
              alt={submission.user.name}
              className="h-4 w-4 rounded-full"
            />
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-600 text-white">
              {submission.user.name?.[0]}
            </div>
          )}
          <span className="truncate text-xs text-zinc-500">
            {submission.user.name}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={busy}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-500 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-600"
        >
          <RotateCcw size={12} />
          Restore
        </button>
        <button
          type="button"
          onClick={confirming ? onConfirmDelete : onRequestDelete}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-500 transition-all",
            confirming
              ? "cursor-pointer border-red-600 bg-red-500 text-white"
              : "cursor-pointer border-zinc-700 bg-transparent text-zinc-400 hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:text-zinc-600"
          )}
        >
          <Trash2 size={12} />
          {confirming ? "Confirm delete" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default function ArchivedList({
  submissions,
}: {
  submissions: SubmissionWithUser[];
}) {
  const archived = useArchivedSubmissions(submissions);
  const restore = useRestoreArchivedSubmission();
  const destroy = useDeleteArchivedSubmission();

  const rows = archived.data;
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const resetTimer = useRef<number | null>(null);

  // The confirm window is a timer, so drop it with the component.
  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const requestDelete = (id: string) => {
    setConfirmDeleteId(id);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setConfirmDeleteId((cur) => (cur === id ? null : cur));
    }, 3000);
  };

  const handleRestore = (id: string) => {
    setBusyId(id);
    restore.mutate(id, {
      onSuccess: () => toast.success("Submission restored"),
      onError: () => toast.error("Could not restore submission"),
      onSettled: () => setBusyId(null),
    });
  };

  const handleDeletePermanent = (id: string) => {
    setConfirmDeleteId(null);
    setBusyId(id);
    destroy.mutate(id, {
      onSuccess: () => toast.success("Deleted permanently"),
      onError: () => toast.error("Could not delete submission"),
      onSettled: () => setBusyId(null),
    });
  };

  if (rows.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
          <Inbox size={22} className="text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-400">Nothing is archived</p>
        <p className="mt-1 text-xs text-zinc-600">
          Soft-deleted submissions will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">
        {rows.length} archived submission{rows.length !== 1 ? "s" : ""}
      </div>
      <div className="divide-y divide-zinc-800/60">
        {rows.map((s) => (
          <ArchivedRow
            key={s.id}
            submission={s}
            busy={busyId === s.id}
            confirming={confirmDeleteId === s.id}
            onRestore={() => handleRestore(s.id)}
            onRequestDelete={() => requestDelete(s.id)}
            onConfirmDelete={() => handleDeletePermanent(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
