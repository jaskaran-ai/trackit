"use client";

import { useState } from "react";
import Link from "next/link";
import { TypeBadge, PriorityBadge } from "@/components/shared/Badges";
import { PROJECT_LABELS, STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { SubmissionWithUser } from "@/types";
import type { SubmissionStatus } from "@/generated/prisma/client/enums";
import { ChevronRight } from "lucide-react";

const COLUMNS: { status: SubmissionStatus; color: string; dot: string }[] = [
  { status: "OPEN", color: "border-blue-500/30", dot: "bg-blue-400" },
  { status: "IN_PROGRESS", color: "border-amber-500/30", dot: "bg-amber-400" },
  { status: "REVIEW", color: "border-violet-500/30", dot: "bg-violet-400" },
  { status: "COMPLETE", color: "border-emerald-500/30", dot: "bg-emerald-400" },
  { status: "CANCELED", color: "border-zinc-600/30", dot: "bg-zinc-500" },
];

const STATUS_BG: Record<SubmissionStatus, string> = {
  OPEN: "bg-blue-500/10",
  IN_PROGRESS: "bg-amber-500/10",
  REVIEW: "bg-violet-500/10",
  COMPLETE: "bg-emerald-500/10",
  CANCELED: "bg-zinc-800/40",
};

function KanbanCard({
  submission,
  onStatusChange,
}: {
  submission: SubmissionWithUser;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  const otherStatuses = COLUMNS.map((c) => c.status).filter(
    (s) => s !== submission.status
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5 hover:border-zinc-700 transition-colors">
      {/* Project tag */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-500 text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
          {PROJECT_LABELS[submission.project] ?? submission.project}
        </span>
        <Link
          href={`/admin/submission/${submission.id}`}
          className="text-[10px] text-zinc-600 hover:text-indigo-400 transition-colors flex items-center gap-0.5"
        >
          View <ChevronRight size={10} />
        </Link>
      </div>

      {/* Title */}
      <p className="text-sm font-500 text-zinc-200 leading-snug line-clamp-2">{submission.title}</p>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <TypeBadge type={submission.type} />
        <PriorityBadge priority={submission.priority} />
      </div>

      {/* Reporter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {submission.user.image ? (
            <img
              src={submission.user.image}
              alt={submission.user.name}
              className="w-4 h-4 rounded-full"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-600 shrink-0">
              {submission.user.name?.[0]}
            </div>
          )}
          <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">
            {submission.user.name}
          </span>
        </div>

        {/* Move to dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="text-[10px] text-zinc-600 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2 py-0.5 rounded transition-colors"
          >
            Move →
          </button>
          {open && (
            <div className="absolute right-0 bottom-6 z-10 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl min-w-[120px] py-1 overflow-hidden">
              {otherStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setOpen(false);
                    onStatusChange(submission.id, s);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({
  submissions: initialSubmissions,
}: {
  submissions: SubmissionWithUser[];
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  const handleStatusChange = async (id: string, newStatus: SubmissionStatus) => {
    const prev = [...submissions];
    setSubmissions((all) =>
      all.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );

    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Moved to ${STATUS_LABELS[newStatus]}`);
    } catch {
      setSubmissions(prev);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {COLUMNS.map(({ status, color, dot }) => {
        const cards = submissions.filter((s) => s.status === status);
        return (
          <div key={status} className="flex-1 min-w-[220px] max-w-[280px]">
            {/* Column header */}
            <div
              className={cn(
                "flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border",
                STATUS_BG[status],
                color
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", dot)} />
              <span className="text-xs font-600 text-zinc-300">
                {STATUS_LABELS[status]}
              </span>
              <span className="ml-auto text-xs font-500 text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {cards.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-700 border border-dashed border-zinc-800 rounded-xl">
                  No items
                </div>
              ) : (
                cards.map((s) => (
                  <KanbanCard
                    key={s.id}
                    submission={s}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
