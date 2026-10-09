"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import toast from "react-hot-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/arc/popover/popover";
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Button } from "@/components/arc/button/button";
import {
  NotificationRow,
  type NotificationWithSubmission,
} from "@/components/layout/NotificationList";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";

const PREVIEW_LIMIT = 10;

export default function NotificationBell() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [open, setOpen] = useState(false);

  const notifications = useNotifications(Boolean(session?.user));
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.data?.notifications ?? [];
  const unread = notifications.data?.unread ?? 0;

  // Fresh rows whenever the panel opens.
  useEffect(() => {
    if (open) void notifications.refetch();
  }, [open, notifications.refetch]);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-control text-secondary transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <Bell size={16} aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent px-1 text-xs font-500 tabular-nums text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5">
          <p className="font-500 text-foreground">Notifications</p>
          {unread > 0 && (
            <span className="text-xs text-muted">
              {unread} new
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            className="px-6 py-10"
            icon={<Bell size={16} aria-hidden />}
            title="You're all caught up"
            description="Nothing has happened on your submissions yet."
          />
        ) : (
          <ScrollArea label="Recent notifications" maxHeight={320}>
            <ul className="divide-y divide-[var(--border-subtle)]">
              {items.slice(0, PREVIEW_LIMIT).map((item) => (
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
          </ScrollArea>
        )}

        <div className="flex items-center gap-1 border-t border-[var(--border-subtle)] p-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handleMarkAllRead}
            disabled={markAll.isPending || unread === 0}
          >
            <CheckCheck size={13} aria-hidden />
            {markAll.isPending ? "Updating" : "Mark all read"}
          </Button>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex flex-1 items-center justify-center rounded-control py-2 text-sm text-secondary transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}