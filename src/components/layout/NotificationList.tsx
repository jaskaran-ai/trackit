"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, MessageSquare, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Notification } from "@/db/types";

/** Shape returned by GET /api/notifications. */
export type NotificationWithSubmission = Notification & {
  submission: { id: string; title: string; type: string } | null;
};

export function notificationIcon(type: string) {
  if (type === "comment") return MessageSquare;
  if (type === "submission_updated") return RefreshCw;
  return Bell;
}

/**
 * One notification row, shared by the bell dropdown and the /notifications
 * page. Rows without a submission have nowhere to go, so they stay static.
 */
export function NotificationRow({
  item,
  href,
  onSelect,
}: {
  item: NotificationWithSubmission;
  href?: string;
  onSelect?: () => void;
}) {
  const Icon = notificationIcon(item.type);
  const unread = !item.read;
  const clickable = Boolean(href && item.submissionId && onSelect);

  const body = (
    <>
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
          unread
            ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
            : "bg-zinc-800 border-zinc-700 text-zinc-500",
        )}
      >
        <Icon size={13} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-500 truncate",
            unread ? "text-zinc-100" : "text-zinc-400",
          )}
        >
          {item.title}
        </p>
        {item.body && (
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.body}</p>
        )}
        <p className="text-[11px] text-zinc-600 mt-1">{formatDate(item.createdAt)}</p>
      </div>

      {unread && (
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"
        />
      )}
    </>
  );

  const shell = "flex items-start gap-3 px-3 py-2.5 text-left transition-colors";

  if (!clickable) {
    return <div className={cn(shell, "cursor-default")}>{body}</div>;
  }

  return (
    <Link href={href!} onClick={onSelect} className={cn(shell, "hover:bg-zinc-800/60")}>
      {body}
    </Link>
  );
}

/** Full-page list with an unread filter and a mark-all-read action. */
export default function NotificationList({
  initialNotifications,
  isAdmin = false,
}: {
  initialNotifications: NotificationWithSubmission[];
  isAdmin?: boolean;
}) {
  const [items, setItems] = useState<NotificationWithSubmission[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [saving, setSaving] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const visible = useMemo(
    () => (filter === "unread" ? items.filter((item) => !item.read) : items),
    [filter, items],
  );

  const markRead = async (item: NotificationWithSubmission) => {
    if (item.read || !item.submissionId) return;

    // Optimistic: the click already navigates away.
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, read: true } : entry,
      ),
    );

    try {
      await fetch(`/api/notifications?id=${item.id}`, { method: "POST" });
    } catch {
      toast.error("Could not mark that notification as read");
    }
  };

  const submissionHref = (submissionId: string) =>
    isAdmin ? `/admin/submission/${submissionId}` : `/submission/${submissionId}`;

  const markAllRead = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications?all=true", { method: "POST" });
      if (!res.ok) throw new Error("Failed to update");

      setItems((current) => current.map((item) => ({ ...item, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not update notifications");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-zinc-800">
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-800"
          role="group"
          aria-label="Filter notifications"
        >
          {(["all", "unread"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={cn(
                "flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-500 transition-colors cursor-pointer",
                filter === option
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {option === "all" ? "All" : "Unread"}
              {option === "unread" && unreadCount > 0 && (
                <span className="text-[10px] text-zinc-500">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={saving || unreadCount === 0}
          className={cn(
            "flex items-center gap-1.5 h-8 px-2.5 ml-auto rounded-lg border border-zinc-700 text-xs font-500 transition-colors",
            saving || unreadCount === 0
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 cursor-pointer",
          )}
        >
          <CheckCheck size={13} />
          {saving ? "Updating…" : "Mark all read"}
        </button>
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mb-4">
            <Bell size={18} className="text-zinc-500" />
          </div>
          <h3 className="font-display text-base font-600 text-zinc-200 mb-1">
            You&apos;re all caught up
          </h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            {filter === "unread"
              ? "No unread notifications right now."
              : "Nothing has happened on your submissions yet."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {visible.map((item) => (
            <li key={item.id}>
              <NotificationRow
                item={item}
                href={
                  item.submissionId ? submissionHref(item.submissionId) : undefined
                }
                onSelect={() => void markRead(item)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
