import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { countUnreadNotifications, listNotifications } from "@/db/notifications";
import { queryKeys, getQueryClient } from "@/lib/query-client";
import Navbar from "@/components/shared/Navbar";
import NotificationList from "@/components/layout/NotificationList";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const isAdmin = session.user.role === "admin";
  const notifications = await listNotifications(session.user.id);

  // Counted server side so the header agrees with the list on first paint.
  const unread = await countUnreadNotifications(session.user.id);

  /*
   * The rows are written into the same cache entry the bell reads, so the page
   * and the badge share one notion of what has been read. Handing the list a
   * separate copy of these rows is what let the two disagree: marking a row
   * read here updated only local state, and the bell kept its count until it
   * refetched.
   */
  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.notifications.list, { notifications, unread });
  const state = dehydrate(queryClient);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <h1 className="font-display text-2xl font-500 text-foreground">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted">
              {unread > 0
                ? `${unread} unread update${unread === 1 ? "" : "s"} on your submissions.`
                : "Updates on the submissions you follow."}
            </p>
          </div>

          {notifications.length > 0 && (
            <span className="rounded-control border border-border bg-surface px-2 py-1 text-xs text-secondary">
              {notifications.length} total
            </span>
          )}
        </div>

        <HydrationBoundary state={state}>
          <NotificationList isAdmin={isAdmin} />
        </HydrationBoundary>
      </main>
    </div>
  );
}