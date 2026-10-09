"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, GripVertical } from "lucide-react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { TypeBadge, PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { Avatar } from "@/components/arc/avatar/avatar";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import AgingBadge from "@/components/admin/AgingBadge";
import VoteButton from "@/components/shared/VoteButton";
import { PROJECT_LABELS, STATUS_LABELS } from "@/lib/labels";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/db/types";
import type { SubmissionWithUser } from "@/types";

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
  const others = SUBMISSION_STATUSES.filter((s) => s !== submission.status);

  return (
    <Draggable draggableId={submission.id} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`space-y-2.5 rounded-control border bg-surface p-2.5 ${
            snapshot.isDragging
              ? "border-accent shadow-lg"
              : "border-[var(--border-subtle)] hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <div
                {...provided.dragHandleProps}
                className="cursor-grab text-muted transition-colors hover:text-secondary active:cursor-grabbing"
              >
                <GripVertical size={14} aria-hidden />
                <span className="sr-only">Drag to move between columns</span>
              </div>
              <span className="truncate text-xs text-muted">
                {PROJECT_LABELS[submission.project] ?? submission.project}
              </span>
            </div>

            <Link
              href={`/admin/submission/${submission.id}`}
              className="flex shrink-0 items-center gap-0.5 text-xs text-muted transition-colors hover:text-accent"
            >
              View
              <ChevronRight size={10} aria-hidden />
            </Link>
          </div>

          <h3 className="line-clamp-2 text-sm font-500 leading-snug text-foreground">
            {submission.title}
          </h3>

          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={submission.type} />
            <PriorityBadge priority={submission.priority} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Avatar
                name={submission.user.name ?? "Unknown"}
                src={submission.user.image ?? undefined}
                size="sm"
              />
              <span className="max-w-24 truncate text-xs text-muted">
                {submission.user.name}
              </span>
            </div>

            {/* The keyboard and touch path to a move. Drag is the shortcut, not
                the only way, so the menu carries every other status. */}
            <DropdownMenu
              label="Move"
              items={others.map((status) => ({
                label: STATUS_LABELS[status],
                onSelect: () => onStatusChange(submission.id, status),
              }))}
            />
          </div>

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
        </article>
      )}
    </Draggable>
  );
}

/**
 * Five lanes, one per status, with drag between them.
 *
 * Arc's `project-board` was the obvious candidate and was deliberately not used:
 * it fixes four stages, so `CANCELED` had nowhere to go, and it ships sample
 * tasks and demo portraits that would have to be gutted. A block is edited
 * through its props or not at all. Its docs also point large boards at a
 * dedicated drag library, which is what this is.
 */
export default function KanbanBoard({
  submissions: initialSubmissions,
}: {
  submissions: KanbanSubmission[];
}) {
  const { toast } = useToastStack();
  const [submissions, setSubmissions] = useState(initialSubmissions);

  async function handleStatusChange(id: string, newStatus: SubmissionStatus) {
    const previous = submissions;
    setSubmissions((all) =>
      all.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
    );

    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      /* No success toast: the card is already sitting in its new column, which
         is the confirmation. The revert below is what needs saying. */
    } catch {
      setSubmissions(previous);
      toast({ type: "error", title: "Could not update the status" });
    }
  }

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    await handleStatusChange(draggableId, destination.droppableId as SubmissionStatus);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex min-h-[400px] gap-3 overflow-x-auto pb-4">
        {SUBMISSION_STATUSES.map((status) => {
          const cards = submissions.filter((s) => s.status === status);
          return (
            <section
              key={status}
              aria-label={`${STATUS_LABELS[status]}, ${cards.length} submissions`}
              className="min-w-[220px] max-w-[280px] flex-1"
            >
              <header className="mb-2.5 flex items-center gap-2 px-2.5 py-2">
                <StatusBadge status={status} />
                <span className="ml-auto text-xs tabular-nums text-muted">
                  {cards.length}
                </span>
              </header>

              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] space-y-2 rounded-control p-1 transition-colors ${
                      snapshot.isDraggingOver ? "bg-surface-muted" : ""
                    }`}
                  >
                    {cards.length === 0 ? (
                      <p className="rounded-control border border-dashed border-[var(--border-subtle)] py-6 text-center text-xs text-muted">
                        Nothing here
                      </p>
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
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}