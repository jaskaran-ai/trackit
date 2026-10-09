"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/arc/popover/popover";
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Button } from "@/components/arc/button/button";
import {
  NotificationRow,
  type NotificationWithSubmission,
} from "@/components/layout/NotificationList";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications";

const PREVIEW_LIMIT = 10;

export default function NotificationBell() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const signedIn = Boolean(session?.user);

  const { toast } = useToastStack();
  const [open, setOpen] = useState(false);

  // Badge polls a cheap unread count; full rows load only when the panel opens.
  const unreadQuery = useUnreadCount({ enabled: signedIn });
  const notifications = useNotifications(signedIn && open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.data?.notifications ?? [];
  const unread =
    unreadQuery.data ??
    notifications.data?.unread ??
    0;

  useEffect(() => {
    if (open && notifications.isStale) void notifications.refetch();
  }, [open, notifications]);

  const handleMarkRead = (item: NotificationWithSubmission) => {
    markRead.mutate(item.id, {
      onError: () =>
        toast({ type: "error", title: "Could not update notification" }),
    });
  };

  const handleMarkAllRead = () => {
    markAll.mutate(undefined, {
      onError: () =>
        toast({ type: "error", title: "Could not update notifications" }),
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

      <PopoverContent align="end" className="w-[22rem] p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <p className="font-500 text-foreground">Notifications</p>
            {unread > 0 && (
              <span className="text-xs text-muted">{unread} new</span>
            )}
          </div>
          <Link
            href="/notifications"
            className="text-xs text-secondary hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>

        <ScrollArea className="max-h-80">
          <div className="px-3 py-2">
            <Skeleton
              loading={notifications.isPending && items.length === 0}
              lines={3}
              label="Loading notifications"
            >
              {items.length === 0 ? (
                <EmptyState
                  className="py-8"
                  title="You're caught up"
                  description="Updates on your submissions will show up here."
                />
              ) : (
                <ul className="-mx-3 divide-y divide-[var(--border-subtle)]">
                  {items.slice(0, PREVIEW_LIMIT).map((item) => (
                    <li key={item.id}>
                      <NotificationRow
                        item={item}
                        href={
                          item.submissionId
                            ? submissionHref(item.submissionId)
                            : undefined
                        }
                        onSelect={() => {
                          if (!item.read) handleMarkRead(item);
                          setOpen(false);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Skeleton>
          </div>
        </ScrollArea>

        <div className="border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5"
            onClick={handleMarkAllRead}
            disabled={markAll.isPending || unread === 0}
          >
            <CheckCheck size={13} aria-hidden />
            {markAll.isPending ? "Updating" : "Mark all read"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
