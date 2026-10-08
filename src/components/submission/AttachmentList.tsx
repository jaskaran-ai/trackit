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
    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all group">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Preview ${att.fileName}`}
        title={`Preview ${att.fileName}`}
        className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2.5 text-left rounded-l-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
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
      </button>

      {/* Kept as its own control so the row stays keyboard reachable */}
      <a
        href={att.fileUrl}
        download={att.fileName}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download ${att.fileName}`}
        title={`Download ${att.fileName}`}
        className="p-2.5 mr-1 text-zinc-600 hover:text-zinc-300 transition-colors rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
      >
        <Download size={13} />
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
