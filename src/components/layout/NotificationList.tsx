"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, MessageSquare, RefreshCw } from "lucide-react";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Button } from "@/components/arc/button/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import type { Notification } from "@/db/types";

/** A notification row joined with enough of its submission to render a title. */
export type NotificationWithSubmission = Notification & {
  submission: { id: string; title: string; type: string } | null;
};

export function notificationIcon(type: string) {
  if (type === "comment") return MessageSquare;
  if (type === "submission_updated") return RefreshCw;
  return Bell;
}

/**
 * One notification row, shared by the bell panel and the /notifications page.
 * Rows without a submission have nowhere to go, so they stay static rather than
 * pretending to be links.
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
      {/* Unread is carried by the row's weight and the dot rather than a
          coloured tile, so a notification type is never told apart by hue. */}
      <Icon
        size={14}
        aria-hidden
        className={cn("mt-0.5 shrink-0", unread ? "text-accent" : "text-muted")}
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate",
            unread ? "font-500 text-foreground" : "text-secondary",
          )}
        >
          {item.title}
        </p>
        {item.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.body}</p>
        )}
        <p className="mt-1 text-xs text-muted">{formatDate(item.createdAt)}</p>
      </div>

      {unread && (
        <span
          aria-hidden="true"
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
        />
      )}
    </>
  );

  const shell = "flex w-full items-start gap-3 px-3 py-3 text-left";

  if (!clickable) {
    return <div className={cn(shell, "cursor-default")}>{body}</div>;
  }

  return (
    <Link href={href!} onClick={onSelect} className={cn(shell, "hover:bg-surface-muted")}>
      {body}
    </Link>
  );
}

/**
 * Full-page inbox. Read state is read from, and written to, the shared
 * notifications cache rather than a local copy, so this page and the bell badge
 * can never report different unread counts.
 */
export default function NotificationList({ isAdmin = false }: { isAdmin?: boolean }) {
  const { toast } = useToastStack();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.data?.notifications ?? [];
  const unread = notifications.data?.unread ?? 0;

  const visible = useMemo(
    () => (filter === "unread" ? items.filter((item) => !item.read) : items),
    [filter, items],
  );

  const submissionHref = (submissionId: string) =>
    isAdmin ? `/admin/submission/${submissionId}` : `/submission/${submissionId}`;

  function handleMarkRead(item: NotificationWithSubmission) {
    if (item.read || !item.submissionId) return;
    // Optimistic: the cache updates first, and reverts itself if the write fails.
    markRead.mutate(item.id);
  }

  function handleMarkAllRead() {
    // The rows themselves flip, which is the confirmation. A toast on top of
    // that would only repeat it, so only the failure needs saying.
    markAll.mutate(undefined, {
      onError: () => toast({ type: "error", title: "Could not update notifications" }),
    });
  }

  return (
    <div className="overflow-hidden rounded-panel border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] px-2.5 py-2">
        <SegmentedControl
          label="Filter notifications"
          value={filter}
          onValueChange={(next) => setFilter(next as "all" | "unread")}
          options={[
            { value: "all", label: "All" },
            {
              value: "unread",
              label: "Unread",
              accessory: unread > 0 ? (
                <span className="ml-1 text-xs text-muted">{unread}</span>
              ) : null,
            },
          ]}
        />

        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={handleMarkAllRead}
          loading={markAll.isPending}
          disabled={unread === 0}
        >
          <CheckCheck size={13} aria-hidden />
          Mark all read
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="py-16"
          icon={<Bell size={18} aria-hidden />}
          title="You're all caught up"
          description={
            filter === "unread"
              ? "No unread notifications right now."
              : "Nothing has happened on your submissions yet."
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {visible.map((item) => (
            <li key={item.id}>
              <NotificationRow
                item={item}
                href={item.submissionId ? submissionHref(item.submissionId) : undefined}
                onSelect={() => handleMarkRead(item)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}