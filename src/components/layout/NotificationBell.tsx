"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  NotificationRow,
  type NotificationWithSubmission,
} from "@/components/layout/NotificationList";

const POLL_MS = 45000;

export default function NotificationBell() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationWithSubmission[]>([]);
  const [unread, setUnread] = useState(0);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;

      const data: {
        notifications?: NotificationWithSubmission[];
        unread?: number;
      } = await res.json();

      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // Keep the last good list rather than flashing an empty panel.
    }
  }, []);

  // Poll, but stay quiet while the tab is in the background.
  useEffect(() => {
    if (!session?.user) return;

    void load();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);

    return () => window.clearInterval(interval);
  }, [load, session?.user]);

  // Fresh data whenever the panel opens.
  useEffect(() => {
    if (open) void load();
  }, [open, load]);

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

  const markRead = async (item: NotificationWithSubmission) => {
    setOpen(false);

    if (item.read || !item.submissionId) return;

    // Optimistic, the navigation is already on its way.
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
    );
    setUnread((count) => Math.max(0, count - 1));

    try {
      await fetch(`/api/notifications?id=${item.id}`, { method: "POST" });
    } catch {
      // A missed write is not worth interrupting the navigation.
    }
  };

  const markAllRead = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications?all=true", { method: "POST" });
      if (!res.ok) throw new Error("Failed to update");

      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not update notifications");
    } finally {
      setSaving(false);
    }
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
                    onSelect={() => void markRead(item)}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="flex items-center border-t border-zinc-800">
            <button
              type="button"
              onClick={markAllRead}
              disabled={saving || unread === 0}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-500 transition-colors",
                saving || unread === 0
                  ? "text-zinc-600 cursor-not-allowed"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 cursor-pointer",
              )}
            >
              <CheckCheck size={13} />
              {saving ? "Updating…" : "Mark all read"}
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
