"use client";

import { useState } from "react";
import { Download, FileText, Film } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import AttachmentLightbox from "@/components/shared/AttachmentLightbox";
import type { Attachment } from "@/types";

function AttachmentRow({
  att,
  onOpen,
}: {
  att: Attachment;
  onOpen: () => void;
}) {
  const isImage = att.mimeType.startsWith("image/");
  const isPDF = att.mimeType === "application/pdf";
  const isVideo = att.mimeType.startsWith("video/");

  return (
    <div className="group flex items-center rounded-control border border-[var(--border-subtle)] transition-colors hover:border-border">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Preview ${att.fileName}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-l-control px-2.5 py-2 text-left"
      >
        {isImage ? (
          <img
            src={att.fileUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-control object-cover"
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-muted"
          >
            <FileText
              size={15}
              className={isPDF ? "text-danger" : isVideo ? "text-muted" : "text-muted"}
            />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-foreground">
            {att.fileName}
          </span>
          <span className="block text-xs text-muted">
            {formatBytes(att.fileSize)}
          </span>
        </span>
      </button>

      {/* Its own control, so the row stays one tab stop and the download does
          not fire when someone only meant to preview. */}
      <a
        href={att.fileUrl}
        download={att.fileName}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download ${att.fileName}`}
        title={`Download ${att.fileName}`}
        className="mr-1 cursor-pointer rounded-control p-2.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <Download size={13} aria-hidden />
      </a>
    </div>
  );
}

export default function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        {attachments.map((att, index) => (
          <AttachmentRow key={att.id} att={att} onOpen={() => setOpenIndex(index)} />
        ))}
      </div>

      {openIndex !== null && (
        <AttachmentLightbox
          attachments={attachments}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}