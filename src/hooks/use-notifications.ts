import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import type { NotificationWithSubmission } from "@/components/layout/NotificationList";
import type { Notification } from "@/db/types";

const NOTIFICATIONS_URL = "/api/notifications";
const UNREAD_URL = "/api/notifications/unread";
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

/**
 * Lightweight unread badge. Polled while the tab is foregrounded; independent
 * of the full notification list so the bell does not drag rows on every tick.
 */
export function useUnreadCount({
  enabled = true,
  refetchInterval = POLL_MS,
}: {
  enabled?: boolean;
  refetchInterval?: number | false;
} = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    enabled,
    queryFn: async () => {
      const res = await fetch(UNREAD_URL);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = (await res.json()) as { unread: number };
      return data.unread;
    },
    refetchInterval,
    refetchIntervalInBackground: false,
  });
}

/** Full notification rows. Fetches on mount / when enabled; no background poll. */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    enabled,
    queryFn: async () => {
      // No `cache: "no-store"` here on purpose: the 30s staleTime in the
      // shared client lets repeat mounts (e.g. navigating between pages)
      // reuse the badge payload instead of re-validating the session and
      // re-running both notification queries every time.
      const res = await fetch(NOTIFICATIONS_URL);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      return (await res.json()) as NotificationsResponse;
    },
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

      const previousList = queryClient.getQueryData<NotificationsResponse>(
        queryKeys.notifications.list,
      );
      const previousUnread = queryClient.getQueryData<number>(
        queryKeys.notifications.unread,
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

      if (previousList) {
        const wasUnread = previousList.notifications.some(
          (entry) => entry.id === id && !entry.read,
        );
        if (wasUnread) {
          queryClient.setQueryData<number>(queryKeys.notifications.unread, (current) =>
            Math.max(0, (current ?? previousList.unread) - 1),
          );
        }
      } else if (typeof previousUnread === "number") {
        queryClient.setQueryData<number>(
          queryKeys.notifications.unread,
          Math.max(0, previousUnread - 1),
        );
      }

      return { previousList, previousUnread };
    },
    onError: (_error, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.notifications.list, context.previousList);
      }
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unread, context.previousUnread);
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

      const previousList = queryClient.getQueryData<NotificationsResponse>(
        queryKeys.notifications.list,
      );
      const previousUnread = queryClient.getQueryData<number>(
        queryKeys.notifications.unread,
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
      queryClient.setQueryData<number>(queryKeys.notifications.unread, 0);

      return { previousList, previousUnread };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.notifications.list, context.previousList);
      }
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unread, context.previousUnread);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
