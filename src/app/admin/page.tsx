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
import { Bug, Sparkles, Users, Inbox } from "lucide-react";
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

  const statCards = [
    { label: "Total", value: stats.total, icon: Inbox, color: "text-white" },
    { label: "Open", value: stats.open, icon: Inbox, color: "text-blue-400" },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Inbox,
      color: "text-amber-400",
    },
    { label: "Bugs", value: stats.bugs, icon: Bug, color: "text-red-400" },
    { label: "Features", value: stats.features, icon: Sparkles, color: "text-violet-400" },
    { label: "Users", value: stats.users, icon: Users, color: "text-emerald-400" },
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
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-2xl font-700 text-white mb-1">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm">All submissions across all users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-fade-up animate-fade-up-delay-1">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4">
              <div className={`font-display text-2xl font-700 ${color} mb-0.5`}>{value}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <Icon size={10} />
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="mb-8 animate-fade-up animate-fade-up-delay-2">
          <StatsCharts stats={chartStats} />
        </div>

        {/* View toggle + content */}
        <div className="animate-fade-up animate-fade-up-delay-2">
          <AdminViewToggle
            tableView={<AdminTable submissions={submissionsWithVotes} />}
            kanbanView={<KanbanBoard submissions={submissionsWithVotes} />}
          />
        </div>

        {/* User management */}
        <div className="mt-8">
          <UserManagement users={users} currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
