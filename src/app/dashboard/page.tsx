import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { countSubmissions, listSubmissions } from "@/db/submissions";
import {
  countVotesBySubmission,
  listVotedSubmissionIds,
} from "@/db/votes";
import { countUnreadNotifications } from "@/db/notifications";
import { getQueryClient, queryKeys } from "@/lib/query-client";
import Navbar from "@/components/shared/Navbar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMetricsSection from "@/components/dashboard/DashboardMetricsSection";
import DashboardSubmissionsSection from "@/components/dashboard/DashboardSubmissionsSection";
import type { DashboardSummary } from "@/hooks/use-dashboard-data";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const userId = session.user.id;
  const isAdmin = session.user.role === "admin";
  const scope = isAdmin ? {} : { userId };

  const [total, open, bugs, features, submissions, unread] = await Promise.all([
    countSubmissions(scope),
    countSubmissions({
      ...scope,
      status: ["OPEN", "IN_PROGRESS", "REVIEW"],
    }),
    countSubmissions({ ...scope, type: "BUG" }),
    countSubmissions({ ...scope, type: "FEATURE" }),
    listSubmissions({ ...scope, lean: true }),
    countUnreadNotifications(userId),
  ]);

  const featureIds = submissions
    .filter((row) => row.type === "FEATURE")
    .map((row) => row.id);

  const [counts, votedIds] = await Promise.all([
    countVotesBySubmission(featureIds),
    listVotedSubmissionIds(featureIds, userId),
  ]);

  const summary: DashboardSummary = {
    total,
    open,
    bugs,
    features,
    submissions: submissions as DashboardSummary["submissions"],
    totalRows: total,
    votes: {
      counts: Object.fromEntries(counts),
      votedIds: Array.from(votedIds),
    },
  };

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.dashboard.summary, summary);
  queryClient.setQueryData(queryKeys.dashboard.submissions, summary.submissions);
  // votedIds array only — Set is not JSON-safe across dehydrate.
  queryClient.setQueryData(queryKeys.dashboard.votes, {
    counts: summary.votes.counts,
    votedIds: summary.votes.votedIds,
  });
  queryClient.setQueryData(queryKeys.notifications.unread, unread);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <DashboardHeader />
          <DashboardMetricsSection />
          <DashboardSubmissionsSection />
        </HydrationBoundary>
      </main>
    </div>
  );
}
