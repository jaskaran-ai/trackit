"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Trash2, Inbox } from "lucide-react";
import { StatusBadge, TypeBadge, ProjectBadge } from "@/components/shared/Badges";
import { cn, formatDate } from "@/lib/utils";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
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
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--border-subtle)]/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-surface-muted/30">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{submission.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={submission.status} />
          <TypeBadge type={submission.type} />
          <ProjectBadge project={submission.project} />
          <span className="text-xs text-muted">
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
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground">
              {submission.user.name?.[0]}
            </div>
          )}
          <span className="truncate text-xs text-muted">
            {submission.user.name}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={busy}
          className="inline-flex cursor-pointer items-center gap-1 rounded-control border border-border bg-surface-muted px-2.5 py-1 text-xs font-500 text-secondary transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:text-muted"
        >
          <RotateCcw size={12} />
          Restore
        </button>
        <button
          type="button"
          onClick={confirming ? onConfirmDelete : onRequestDelete}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1 rounded-control border px-2.5 py-1 text-xs font-500 transition-all",
            confirming
              ? "cursor-pointer border-red-600 bg-red-500 text-foreground"
              : "cursor-pointer border-border bg-transparent text-secondary hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:text-muted"
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
  const { toast } = useToastStack();
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
      // It is back in the list; nothing else needs saying.
      onError: () => toast({ type: "error", title: "Could not restore the submission" }),
      onSettled: () => setBusyId(null),
    });
  };

  const handleDeletePermanent = (id: string) => {
    setConfirmDeleteId(null);
    setBusyId(id);
    destroy.mutate(id, {
      // It is gone from the archive.
      onError: () => toast({ type: "error", title: "Could not delete the submission" }),
      onSettled: () => setBusyId(null),
    });
  };

  if (rows.length === 0) {
    return (
      <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-12 text-center">
        <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
          <Inbox size={22} className="text-muted" />
        </div>
        <p className="text-sm text-secondary">Nothing is archived</p>
        <p className="mt-1 text-xs text-muted">
          Soft-deleted submissions will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-[var(--border-subtle)] rounded-panel overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] px-3 py-2 text-xs text-muted">
        {rows.length} archived submission{rows.length !== 1 ? "s" : ""}
      </div>
      <div className="divide-y divide-[var(--border-subtle)]/60">
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
