"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Film } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { Button } from "@/components/arc/button/button";
import { PRIMARY_LINK_CLASS } from "@/components/shared/linkButton";
import type { Attachment } from "@/types";

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
}

/**
 * Full-size attachment preview.
 *
 * Arc's `dialog` supplies the parts this used to reimplement: the overlay, the
 * focus trap, the focus return, Escape to close, and the page scroll lock. What
 * it does not supply is stepping between files, so the arrow keys and the two
 * buttons are added on top.
 */
export default function AttachmentLightbox({
  attachments,
  initialIndex = 0,
  onClose,
}: {
  attachments: Attachment[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(attachments.length - 1, 0)),
  );

  const goTo = useCallback(
    (delta: number) => {
      setIndex((prev) => {
        if (attachments.length === 0) return prev;
        return (prev + delta + attachments.length) % attachments.length;
      });
    },
    [attachments.length],
  );

  // Arrow keys step between files. Escape is left to the dialog.
  useEffect(() => {
    if (attachments.length < 2) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [attachments.length, goTo]);

  if (attachments.length === 0) return null;

  const current = attachments[index];
  const showArrows = attachments.length > 1;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        title={`Attachment ${index + 1} of ${attachments.length}`}
        description={current.fileName}
        className="max-w-4xl"
      >
        <div className="flex items-center gap-2.5">
          {showArrows && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(-1)}
              aria-label="Previous attachment"
            >
              <ChevronLeft size={15} aria-hidden />
            </Button>
          )}

          <figure className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
            {current.mimeType.startsWith("image/") ? (
              <img
                src={current.fileUrl}
                alt={current.fileName}
                className="max-h-[70vh] max-w-full rounded-control border border-border object-contain"
              />
            ) : isVideo(current.mimeType) ? (
              <video
                key={current.id}
                src={current.fileUrl}
                controls
                className="max-h-[70vh] max-w-full rounded-control border border-border bg-black"
              />
            ) : (
              <div className="flex max-w-sm flex-col items-center gap-2.5 rounded-panel border border-border bg-surface-muted p-6 text-center">
                <Film size={22} aria-hidden className="text-muted" />
                <div>
                  <p className="break-all text-foreground">{current.fileName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatBytes(current.fileSize)}
                  </p>
                </div>
                {/* A real link, not a button wrapping one: this downloads and
                    should open in a new tab like any other download link. */}
                <a
                  href={current.fileUrl}
                  download={current.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={PRIMARY_LINK_CLASS}
                >
                  <Download size={14} aria-hidden />
                  Download
                </a>
              </div>
            )}

            {showArrows && (
              <figcaption className="text-xs text-muted">
                Use the arrow keys to move between attachments
              </figcaption>
            )}
          </figure>

          {showArrows && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(1)}
              aria-label="Next attachment"
            >
              <ChevronRight size={15} aria-hidden />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}