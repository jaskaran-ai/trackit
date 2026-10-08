"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Film, Paperclip, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import type { Attachment } from "@/types";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(MOTION_QUERY);
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function isVideo(mimeType: string) {
  return mimeType === "video/mp4" || mimeType.startsWith("video/");
}

export default function AttachmentLightbox({
  attachments,
  initialIndex = 0,
  onClose,
}: {
  attachments: Attachment[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(attachments.length - 1, 0))
  );
  const closeRef = useRef<HTMLButtonElement>(null);

  const goTo = useCallback(
    (delta: number) => {
      setIndex((prev) => {
        if (attachments.length === 0) return prev;
        return (prev + delta + attachments.length) % attachments.length;
      });
    },
    [attachments.length]
  );

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes, arrows navigate.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, onClose]);

  // Freeze the page behind the overlay.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (attachments.length === 0) return null;

  const current = attachments[index];
  const showArrows = attachments.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Attachment preview"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4",
        !reducedMotion && "animate-fade-up"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between gap-3 p-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-500 text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-full px-3 py-1.5">
          <Paperclip size={11} />
          {index + 1} / {attachments.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Prev / next */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous attachment"
            className="absolute left-3 sm:left-6 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next attachment"
            className="absolute right-3 sm:right-6 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Content */}
      <figure className="flex flex-col items-center gap-3 max-w-full max-h-full">
        <div
          className={cn(
            "flex items-center justify-center",
            !reducedMotion && "transition-transform duration-200"
          )}
        >
          {current.mimeType.startsWith("image/") ? (
            <img
              src={current.fileUrl}
              alt={current.fileName}
              className="max-h-[75vh] max-w-[90vw] rounded-xl border border-zinc-800 object-contain"
            />
          ) : isVideo(current.mimeType) ? (
            <video
              key={current.id}
              src={current.fileUrl}
              controls
              className="max-h-[75vh] max-w-[90vw] rounded-xl border border-zinc-800 bg-black"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-sm">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Film size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-200 break-all">{current.fileName}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{formatBytes(current.fileSize)}</p>
              </div>
              <a
                href={current.fileUrl}
                download={current.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-500 px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          )}
        </div>

        <figcaption className="text-xs text-zinc-500 text-center max-w-[90vw] truncate">
          {current.fileName}
        </figcaption>
      </figure>
    </div>
  );
}
