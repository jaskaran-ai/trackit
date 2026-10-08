import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubmissionById } from "@/db/submissions";
import Navbar from "@/components/shared/Navbar";
import { StatusBadge, TypeBadge, PriorityBadge } from "@/components/shared/Badges";
import VoteButton from "@/components/shared/VoteButton";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, Paperclip } from "lucide-react";
import Link from "next/link";
import AttachmentList from "@/components/submission/AttachmentList";
import StatusHistory from "@/components/submission/StatusHistory";
import CommentsSection from "@/components/submission/CommentsSection";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) notFound();

  const isAdmin = session.user.role === "admin";
  const isOwner = submission.userId === session.user.id;
  if (!isAdmin && !isOwner) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ChevronLeft size={15} />
          Back to dashboard
        </Link>

        <div className="animate-fade-up">
          {/* Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-display text-xl font-700 text-white leading-snug flex-1">
                {submission.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={submission.status} />
                {submission.type === "FEATURE" && (
                  <VoteButton submissionId={submission.id} size="md" />
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <TypeBadge type={submission.type} />
              <PriorityBadge priority={submission.priority} />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
              {submission.user.image ? (
                <img
                  src={submission.user.image}
                  alt={submission.user.name}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-600">
                  {submission.user.name?.[0]}
                </div>
              )}
              <div>
                <p className="text-xs font-500 text-zinc-300">{submission.user.name}</p>
                <p className="text-xs text-zinc-600">{formatDate(submission.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
            <h2 className="font-display text-sm font-600 text-zinc-400 uppercase tracking-wider mb-4">
              Description
            </h2>
            <div
              className="prose-dark text-sm text-zinc-300"
              dangerouslySetInnerHTML={{ __html: submission.description }}
            />
          </div>

          {/* Attachments */}
          {submission.attachments.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
              <h2 className="font-display text-sm font-600 text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Paperclip size={13} />
                Attachments ({submission.attachments.length})
              </h2>
              <AttachmentList attachments={submission.attachments} />
            </div>
          )}

          {/* Audit trail */}
          <StatusHistory submissionId={submission.id} />

          {/* Discussion */}
          <CommentsSection
            submissionId={submission.id}
            currentUserId={session.user.id}
            isAdmin={isAdmin}
          />
        </div>
      </main>
    </div>
  );
}
