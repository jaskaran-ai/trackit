import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { NotificationWithSubmission } from "@/components/layout/NotificationList";
import type { Notification } from "@/db/types";

const NOTIFICATIONS_URL = "/api/notifications";
const POLL_MS = 45_000;

/** Shape returned by GET /api/notifications. */
export type NotificationsResponse = {
  notifications: NotificationWithSubmission[];
  unread: number;
};

async function postJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`Request failed with ${res.status}`);
  return (await res.json()) as T;
}

/** Rows plus the unread count, polled while the tab is in the foreground. */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    enabled,
    queryFn: async () => {
      const res = await fetch(NOTIFICATIONS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      return (await res.json()) as NotificationsResponse;
    },
    // A natural polling interval replaces the old setInterval, and
    // refetchIntervalInBackground keeps it quiet while the tab is hidden.
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/**
 * Marks one notification read. The row and the badge flip immediately, then the
 * server response and a refetch reconcile the cache.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postJson<Notification>(`${NOTIFICATIONS_URL}?id=${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previous = queryClient.getQueryData<NotificationsResponse>(
        queryKeys.notifications.list,
      );

      queryClient.setQueryData<NotificationsResponse>(queryKeys.notifications.list, (current) => {
        if (!current) return current;
        const wasUnread = current.notifications.some((entry) => entry.id === id && !entry.read);
        return {
          ...current,
          unread: wasUnread ? Math.max(0, current.unread - 1) : current.unread,
          notifications: current.notifications.map((entry) =>
            entry.id === id ? { ...entry, read: true } : entry,
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.list, context.previous);
      }
    },
    onSuccess: (updated) => {
      // Reconcile with exactly what the server stored.
      queryClient.setQueryData<NotificationsResponse>(queryKeys.notifications.list, (current) =>
        current
          ? {
              ...current,
              notifications: current.notifications.map((entry) =>
                entry.id === updated.id ? { ...entry, ...updated } : entry,
              ),
            }
          : current,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Marks every notification read at once, same optimistic treatment as one. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postJson<{ success: boolean }>(`${NOTIFICATIONS_URL}?all=true`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previous = queryClient.getQueryData<NotificationsResponse>(
        queryKeys.notifications.list,
      );

      queryClient.setQueryData<NotificationsResponse>(queryKeys.notifications.list, (current) =>
        current
          ? {
              ...current,
              unread: 0,
              notifications: current.notifications.map((entry) => ({ ...entry, read: true })),
            }
          : current,
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.list, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
