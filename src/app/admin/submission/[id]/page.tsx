import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubmissionById } from "@/db/submissions";
import Navbar from "@/components/shared/Navbar";
import { StatusBadge, TypeBadge, PriorityBadge } from "@/components/shared/Badges";
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

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ChevronLeft size={15} />
          Back to admin
        </Link>

        <div className="animate-fade-up space-y-4">
          {/* Header card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
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

            {/* Reporter info */}
            <div className="flex items-center gap-3 py-4 border-t border-b border-zinc-800 mb-4">
              {submission.user.image ? (
                <img
                  src={submission.user.image}
                  alt={submission.user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm text-white font-600">
                  {submission.user.name?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-500 text-zinc-200">{submission.user.name}</p>
                <p className="text-xs text-zinc-500">{submission.user.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-600">
                <Calendar size={12} />
                {formatDate(submission.createdAt)}
              </div>
            </div>

            {/* Admin controls */}
            <AdminStatusControls submission={submission} />
          </div>

          {/* Description */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
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
                      className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-2.5 transition-all group"
                    >
                      <div className="w-8 h-8 bg-zinc-700 rounded-md flex items-center justify-center shrink-0">
                        {isImage ? (
                          <ImageIcon size={15} className="text-blue-400" />
                        ) : isPDF ? (
                          <FileText size={15} className="text-red-400" />
                        ) : isVideo ? (
                          <Film size={15} className="text-violet-400" />
                        ) : (
                          <FileText size={15} className="text-zinc-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{att.fileName}</p>
                        <p className="text-xs text-zinc-500">{formatBytes(att.fileSize)}</p>
                      </div>
                      <Download size={13} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
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
