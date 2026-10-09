import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getSubmissionById } from "@/db/submissions";
import { listComments } from "@/db/comments";
import { listHistory } from "@/db/history";
import { getVoteSummary } from "@/db/votes";
import { queryKeys, getQueryClient } from "@/lib/query-client";
import Navbar from "@/components/shared/Navbar";
import { StatusBadge, TypeBadge, PriorityBadge } from "@/components/shared/Badges";
import StatusHistory from "@/components/submission/StatusHistory";
import CommentsSection from "@/components/submission/CommentsSection";
import VoteButton from "@/components/shared/VoteButton";
import AdminStatusControls from "./AdminStatusControls";
import { formatDate, formatBytes } from "@/lib/utils";
import {
  ChevronLeft,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  Calendar,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");

  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) notFound();

  const [comments, history, vote] = await Promise.all([
    listComments(id),
    listHistory(id),
    submission.type === "FEATURE"
      ? getVoteSummary(id, session.user.id)
      : Promise.resolve(null),
  ]);

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.comments(id), comments);
  queryClient.setQueryData(queryKeys.history(id), history);
  const state = dehydrate(queryClient);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-3 sm:px-5 py-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-secondary transition-colors mb-5"
        >
          <ChevronLeft size={15} />
          Back to admin
        </Link>

        <div className=" space-y-3">
          {/* Header card */}
          <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="font-display text-xl font-500 text-foreground leading-snug flex-1">
                {submission.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={submission.status} />
                {submission.type === "FEATURE" && (
                  <VoteButton
                    submissionId={submission.id}
                    size="md"
                    initialCount={vote?.count}
                    initialHasVoted={vote?.hasVoted}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <TypeBadge type={submission.type} />
              <PriorityBadge priority={submission.priority} />
            </div>

            {/* Reporter info */}
            <div className="flex items-center gap-2.5 py-3 border-t border-b border-[var(--border-subtle)] mb-3">
              {submission.user.image ? (
                <img
                  src={submission.user.image}
                  alt={submission.user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground font-500">
                  {submission.user.name?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-500 text-foreground">{submission.user.name}</p>
                <p className="text-xs text-muted">{submission.user.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted">
                <Calendar size={12} />
                {formatDate(submission.createdAt)}
              </div>
            </div>

            {/* Due date / resolved */}
            {(submission.dueDate || submission.resolvedAt) && (
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {submission.dueDate && (
                  <span className="flex items-center gap-1.5 text-secondary">
                    <CalendarClock size={12} className="text-muted" />
                    Due {formatDate(submission.dueDate)}
                  </span>
                )}
                {submission.resolvedAt && (
                  <span className="flex items-center gap-1.5 text-emerald-400/90">
                    <CheckCircle2 size={12} />
                    Resolved {formatDate(submission.resolvedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Admin controls */}
            <AdminStatusControls submission={submission} />
          </div>

          {/* Description */}
          <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-5">
            <h2 className="font-display text-sm font-500 text-secondary mb-3">
              Description
            </h2>
            <div
              className="prose-dark text-sm text-secondary"
              dangerouslySetInnerHTML={{ __html: submission.description }}
            />
          </div>

          <HydrationBoundary state={state}>
            <StatusHistory submissionId={submission.id} />
            <CommentsSection
              submissionId={submission.id}
              currentUserId={session.user.id}
              currentUserName={session.user.name}
              currentUserImage={session.user.image}
              isAdmin
            />
          </HydrationBoundary>

          {/* Attachments */}
          {submission.attachments.length > 0 && (
            <div className="bg-surface border border-[var(--border-subtle)] rounded-panel p-5">
              <h2 className="font-display text-sm font-500 text-secondary mb-3 flex items-center gap-2">
                <Paperclip size={13} />
                Attachments ({submission.attachments.length})
              </h2>
              <div className="space-y-2">
                {submission.attachments.map((att) => {
                  const isImage = att.mimeType.startsWith("image/");
                  const isPDF = att.mimeType === "application/pdf";
                  const isVideo = att.mimeType.startsWith("video/");

                  return (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 bg-surface-muted hover:bg-surface-raised border border-border rounded-control px-2.5 py-2 transition-all group"
                    >
                      <div className="w-8 h-8 bg-surface-raised rounded-md flex items-center justify-center shrink-0">
                        {isImage ? (
                          <ImageIcon size={15} className="text-blue-400" />
                        ) : isPDF ? (
                          <FileText size={15} className="text-red-400" />
                        ) : isVideo ? (
                          <Film size={15} className="text-violet-400" />
                        ) : (
                          <FileText size={15} className="text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{att.fileName}</p>
                        <p className="text-xs text-muted">{formatBytes(att.fileSize)}</p>
                      </div>
                      <Download size={13} className="text-muted group-hover:text-secondary transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
