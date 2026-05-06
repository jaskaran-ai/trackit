import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import { StatusBadge, TypeBadge, PriorityBadge } from "@/components/shared/Badges";
import { formatDate, formatBytes } from "@/lib/utils";
import { ChevronLeft, Paperclip, Download, FileText, Film } from "lucide-react";
import Link from "next/link";

function FilePreview({ att }: { att: any }) {
  const isImage = att.mimeType.startsWith("image/");
  const isPDF = att.mimeType === "application/pdf";
  const isVideo = att.mimeType.startsWith("video/");

  return (
    <a
      href={att.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2.5 transition-all group"
    >
      {isImage ? (
        <img
          src={att.fileUrl}
          alt={att.fileName}
          className="w-8 h-8 rounded-md object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center shrink-0">
          {isPDF ? (
            <FileText size={15} className="text-red-400" />
          ) : isVideo ? (
            <Film size={15} className="text-violet-400" />
          ) : (
            <FileText size={15} className="text-zinc-400" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate">{att.fileName}</p>
        <p className="text-xs text-zinc-600">{formatBytes(att.fileSize)}</p>
      </div>
      <Download size={13} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
    </a>
  );
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      attachments: true,
    },
  });

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
              <StatusBadge status={submission.status} />
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="font-display text-sm font-600 text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Paperclip size={13} />
                Attachments ({submission.attachments.length})
              </h2>
              <div className="space-y-2">
                {submission.attachments.map((att) => (
                  <FilePreview key={att.id} att={att} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
