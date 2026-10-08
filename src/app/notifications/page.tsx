import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { countUnreadNotifications, listNotifications } from "@/db/notifications";
import Navbar from "@/components/shared/Navbar";
import NotificationList from "@/components/layout/NotificationList";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const isAdmin = session.user.role === "admin";
  const notifications = await listNotifications(session.user.id);

  // Counted server side so the header agrees with the list on first paint.
  const unread = await countUnreadNotifications(session.user.id);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-700 text-white mb-1">
              Notifications
            </h1>
            <p className="text-zinc-500 text-sm">
              {unread > 0
                ? `${unread} unread update${unread === 1 ? "" : "s"} on your submissions.`
                : "Updates on the submissions you follow."}
            </p>
          </div>

          {notifications.length > 0 && (
            <span className="text-xs font-500 text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
              {notifications.length} total
            </span>
          )}
        </div>

        <div className="animate-fade-up animate-fade-up-delay-1">
          <NotificationList
            initialNotifications={notifications}
            isAdmin={isAdmin}
          />
        </div>
      </main>
    </div>
  );
}
