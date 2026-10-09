import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubmissionStats, listSubmissions } from "@/db/submissions";
import { countVotesBySubmission, listVotedSubmissionIds } from "@/db/votes";
import { listUsers } from "@/db/users";
import Navbar from "@/components/shared/Navbar";
import AdminTable from "./AdminTable";
import KanbanBoard from "./KanbanBoard";
import AdminViewToggle from "./AdminViewToggle";
import StatsCharts, { type AdminStats } from "@/components/admin/StatsCharts";
import UserManagement from "@/components/admin/UserManagement";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import type { SubmissionWithUser } from "@/types";

// Vote state attached on the server and read by the table and kanban views, so
// their vote buttons render from initial values instead of fetching per row.
type SubmissionWithVotes = SubmissionWithUser & {
  voteCount: number;
  hasVoted: boolean;
};

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [submissions, stats, users] = await Promise.all([
    listSubmissions(),
    getSubmissionStats(),
    listUsers(),
  ]);

  // One batched pair of vote queries for both views, instead of one vote
  // summary request per feature row on the page. Bugs never show a button.
  const featureIds = submissions
    .filter((s) => s.type === "FEATURE")
    .map((s) => s.id);

  const [voteCounts, votedIds] = await Promise.all([
    countVotesBySubmission(featureIds),
    listVotedSubmissionIds(featureIds, session.user.id),
  ]);

  const submissionsWithVotes = submissions.map((submission) => ({
    ...submission,
    voteCount: voteCounts.get(submission.id) ?? 0,
    hasVoted: votedIds.has(submission.id),
  })) as SubmissionWithVotes[];

  /* Each card carries its own context line, so no headline number on this page
     needs the row around it to explain it. */
  const statCards = [
    { label: "Total", value: stats.total, context: "All time" },
    { label: "Open", value: stats.open, context: "Awaiting triage" },
    { label: "In progress", value: stats.inProgress, context: "Being worked on" },
    { label: "In review", value: stats.review, context: "Awaiting sign-off" },
    { label: "Bugs", value: stats.bugs, context: `${stats.features} feature requests` },
    { label: "Users", value: stats.users, context: `${stats.archived} archived` },
  ];

  const chartStats: AdminStats = {
    total: stats.total,
    byStatus: {
      open: stats.open,
      inProgress: stats.inProgress,
      review: stats.review,
      complete: stats.complete,
      canceled: stats.canceled,
    },
    byType: { bugs: stats.bugs, features: stats.features },
    users: stats.users,
    archived: stats.archived,
    overdue: stats.overdue,
    avgResolutionHours: stats.avgResolutionHours,
    byProject: stats.byProject.map((row) => ({
      project: row.project as string,
      total: row.total,
      open: row.open,
    })),
    trend: stats.trend,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-500 text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-muted text-sm">All submissions across all users</p>
        </div>

        {/* The KPI row. StatsCharts below carries only the charts: it used to
            repeat its own row of headline numbers, so this page showed two. */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {statCards.map(({ label, value, context }) => (
            <MetricCard
              key={label}
              label={label}
              value={value}
              context={context}
            />
          ))}
        </div>

        {/* Charts */}
        <div className="mb-8">
          <StatsCharts stats={chartStats} />
        </div>

        {/* View toggle + content */}
        <AdminViewToggle
          tableView={<AdminTable submissions={submissionsWithVotes} />}
          kanbanView={<KanbanBoard submissions={submissionsWithVotes} />}
        />

        {/* User management */}
        <div className="mt-8">
          <UserManagement users={users} currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
