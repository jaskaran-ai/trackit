"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  NotificationRow,
  type NotificationWithSubmission,
} from "@/components/layout/NotificationList";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";

export default function NotificationBell() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useNotifications(Boolean(session?.user));
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.data?.notifications ?? [];
  const unread = notifications.data?.unread ?? 0;

  // Fresh rows whenever the panel opens.
  useEffect(() => {
    if (open) void notifications.refetch();
  }, [open, notifications.refetch]);

  // Outside click and Escape close the panel.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleMarkRead = (item: NotificationWithSubmission) => {
    setOpen(false);

    if (item.read || !item.submissionId) return;

    // The cache flips before the POST resolves; a failure reverts it.
    void markRead.mutate(item.id);
  };

  const handleMarkAllRead = () => {
    markAll.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: () => toast.error("Could not update notifications"),
    });
  };

  if (!session?.user) return null;

  const submissionHref = (submissionId: string) =>
    isAdmin ? `/admin/submission/${submissionId}` : `/submission/${submissionId}`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-indigo-500 text-white text-[10px] font-600 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800">
            <p className="text-sm font-600 text-zinc-200">Notifications</p>
            {unread > 0 && (
              <span className="text-[10px] font-500 text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                {unread} new
              </span>
            )}
          </div>

          {/* Rows */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mb-3">
                <Bell size={16} className="text-zinc-500" />
              </div>
              <p className="text-sm font-500 text-zinc-300">You&apos;re all caught up</p>
              <p className="text-xs text-zinc-600 mt-1">
                Nothing has happened on your submissions yet.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-800">
              {items.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <NotificationRow
                    item={item}
                    href={
                      item.submissionId ? submissionHref(item.submissionId) : undefined
                    }
                    onSelect={() => handleMarkRead(item)}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="flex items-center border-t border-zinc-800">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAll.isPending || unread === 0}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-500 transition-colors",
                markAll.isPending || unread === 0
                  ? "text-zinc-600 cursor-not-allowed"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 cursor-pointer",
              )}
            >
              <CheckCheck size={13} />
              {markAll.isPending ? "Updating…" : "Mark all read"}
            </button>

            <div className="w-px h-6 bg-zinc-800" />

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex-1 flex items-center justify-center h-10 text-xs font-500 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
