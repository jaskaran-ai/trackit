import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_COLORS = {
  OPEN: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  REVIEW: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  COMPLETE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CANCELED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETE: "Complete",
  CANCELED: "Canceled",
};

export const PROJECT_LABELS: Record<string, string> = {
  IVALT_MOBILE: "iVALT Mobile App",
  DOCU_ID: "DocuID",
  ONDEMAND_ID: "OndemandID",
  KEYCLOCK: "KeyClock",
  OTHER: "Other",
};

export const PRIORITY_COLORS = {
  LOW: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  MEDIUM: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
} as const;

export const TYPE_COLORS = {
  BUG: "bg-red-500/15 text-red-400 border-red-500/30",
  FEATURE: "bg-violet-500/15 text-violet-400 border-violet-500/30",
} as const;

export const ACCEPTED_FILE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "video/mp4": [".mp4"],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 5;
