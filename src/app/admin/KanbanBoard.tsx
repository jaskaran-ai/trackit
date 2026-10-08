"use client";

import { useState } from "react";
import Link from "next/link";
import { TypeBadge, PriorityBadge } from "@/components/shared/Badges";
import { PROJECT_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import AgingBadge from "@/components/admin/AgingBadge";
import VoteButton from "@/components/shared/VoteButton";
import toast from "react-hot-toast";
import type { SubmissionWithUser } from "@/types";
import type { SubmissionStatus } from "@/db/types";
import { ChevronRight, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const COLUMNS: { status: SubmissionStatus; dot: string }[] = [
  { status: "OPEN", dot: "bg-blue-400" },
  { status: "IN_PROGRESS", dot: "bg-amber-400" },
  { status: "REVIEW", dot: "bg-violet-400" },
  { status: "COMPLETE", dot: "bg-emerald-400" },
  { status: "CANCELED", dot: "bg-zinc-500" },
];

// Submissions arrive with vote state attached on the server, so a card's vote
// button renders from initial values instead of fetching each one on mount.
type KanbanSubmission = SubmissionWithUser & {
  voteCount?: number;
  hasVoted?: boolean;
};

function KanbanCard({
  submission,
  onStatusChange,
  index,
}: {
  submission: KanbanSubmission;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  const otherStatuses = COLUMNS.map((c) => c.status).filter(
    (s) => s !== submission.status
  );

  return (
    <Draggable draggableId={submission.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5 transition-colors",
            snapshot.isDragging ? "border-indigo-500 shadow-lg shadow-indigo-500/20 rotate-2" : "hover:border-zinc-700"
          )}
        >
          {/* Header with drag handle */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <div
                {...provided.dragHandleProps}
                className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <GripVertical size={14} />
              </div>
              <span className="text-[10px] font-500 text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                {PROJECT_LABELS[submission.project] ?? submission.project}
              </span>
            </div>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((v) => !v);
                }}
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
                      onClick={(e) => {
                        e.stopPropagation();
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

          {/* Footer: aging + votes */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <AgingBadge
              createdAt={submission.createdAt}
              dueDate={submission.dueDate}
              status={submission.status}
              resolvedAt={submission.resolvedAt}
            />
            {submission.type === "FEATURE" && (
              <VoteButton
                submissionId={submission.id}
                initialCount={submission.voteCount}
                initialHasVoted={submission.hasVoted}
                size="sm"
              />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({
  submissions: initialSubmissions,
}: {
  submissions: KanbanSubmission[];
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as SubmissionStatus;
    await handleStatusChange(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {COLUMNS.map(({ status, dot }) => {
          const cards = submissions.filter((s) => s.status === status);
          return (
            <div key={status} className="flex-1 min-w-[220px] max-w-[280px]">
              {/* Column header */}
              <div
                className={cn(
                  "flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border",
                  STATUS_COLORS[status]
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
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "space-y-2 min-h-[200px] rounded-xl p-1 transition-colors",
                      snapshot.isDraggingOver ? "bg-zinc-800/50" : ""
                    )}
                  >
                    {cards.length === 0 ? (
                      <div className="text-center py-8 text-xs text-zinc-700 border border-dashed border-zinc-800 rounded-xl">
                        No items
                      </div>
                    ) : (
                      cards.map((s, index) => (
                        <KanbanCard
                          key={s.id}
                          submission={s}
                          onStatusChange={handleStatusChange}
                          index={index}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
