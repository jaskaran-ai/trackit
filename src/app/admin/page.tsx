import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { getSubmissionStats, listSubmissions } from "@/db/submissions";
import { listUsers } from "@/db/users";
import {
  countVotesBySubmission,
  listVotedSubmissionIds,
} from "@/db/votes";
import { countUnreadNotifications } from "@/db/notifications";
import { getQueryClient, queryKeys } from "@/lib/query-client";
import type { AdminStats } from "@/components/admin/StatsCharts";
import Navbar from "@/components/shared/Navbar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsSection from "@/components/admin/AdminStatsSection";
import AdminSubmissionsSection from "@/components/admin/AdminSubmissionsSection";
import AdminUsersSection from "@/components/admin/AdminUsersSection";
import type { SubmissionWithUser } from "@/types";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [statsRaw, submissions, users, unread] = await Promise.all([
    getSubmissionStats(30),
    listSubmissions({ lean: true, unlimited: true }),
    listUsers(),
    countUnreadNotifications(session.user.id),
  ]);

  const stats: AdminStats = {
    total: statsRaw.total,
    byStatus: {
      open: statsRaw.open,
      inProgress: statsRaw.inProgress,
      review: statsRaw.review,
      complete: statsRaw.complete,
      canceled: statsRaw.canceled,
    },
    byType: { bugs: statsRaw.bugs, features: statsRaw.features },
    users: statsRaw.users,
    archived: statsRaw.archived,
    overdue: statsRaw.overdue,
    avgResolutionHours: statsRaw.avgResolutionHours,
    byProject: statsRaw.byProject,
    trend: statsRaw.trend,
  };

  const featureIds = submissions
    .filter((row) => row.type === "FEATURE")
    .map((row) => row.id);

  const [counts, votedIds] = await Promise.all([
    countVotesBySubmission(featureIds),
    listVotedSubmissionIds(featureIds, session.user.id),
  ]);

  // Serializable vote payload — Set does not survive dehydrate/JSON.
  const votesPayload = {
    counts: Object.fromEntries(counts),
    votedIds: Array.from(votedIds),
  };

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.adminStats, stats);
  queryClient.setQueryData(
    queryKeys.adminSubmissions,
    submissions as SubmissionWithUser[],
  );
  queryClient.setQueryData(queryKeys.adminUsers, users);
  queryClient.setQueryData(queryKeys.adminVotes, votesPayload);
  queryClient.setQueryData(queryKeys.notifications.unread, unread);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AdminHeader />
          <AdminStatsSection />
          <AdminSubmissionsSection />
          <div className="mt-8">
            <AdminUsersSection currentUserId={session.user.id} />
          </div>
        </HydrationBoundary>
      </main>
    </div>
  );
}
