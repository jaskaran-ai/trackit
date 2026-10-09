import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { Inbox, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { listSubmissions } from "@/db/submissions";
import { countVotesBySubmission, listVotedSubmissionIds } from "@/db/votes";
import Navbar from "@/components/shared/Navbar";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { PRIMARY_LINK_CLASS } from "@/components/shared/linkButton";
import type { SubmissionWithUser } from "@/types";

// Vote state attached on the server and read by SubmissionCard, which passes it
// to VoteButton as initial values so no card fetches its summary on mount.
type SubmissionWithVotes = SubmissionWithUser & {
  voteCount: number;
  hasVoted: boolean;
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const submissions = await listSubmissions({ userId: session.user.id });

  // One batched pair of vote queries per page load. Counting inside each card
  // would fire a GET /api/submissions/[id]/vote request per feature row, and
  // only features render a vote button, so only their ids are queried.
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

  const bugs = submissions.filter((s) => s.type === "BUG").length;
  const features = submissions.filter((s) => s.type === "FEATURE").length;
  const stillOpen = submissions.filter(
    (s) => s.status === "OPEN" || s.status === "IN_PROGRESS" || s.status === "REVIEW",
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 font-display text-2xl font-500 text-foreground">
              My submissions
            </h1>
            <p className="text-sm text-muted">
              Welcome back, {session.user.name?.split(" ")[0]}
            </p>
          </div>

          <Link href="/submit" className={PRIMARY_LINK_CLASS}>
            <Plus size={15} aria-hidden />
            New submission
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            label="Total"
            value={submissions.length}
            context={`${stillOpen} still in progress`}
          />
          <MetricCard label="Bug reports" value={bugs} context="Reported by you" />
          <MetricCard
            label="Feature requests"
            value={features}
            context="Reported by you"
          />
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-panel border border-border bg-surface">
            <EmptyState
              className="py-20"
              icon={<Inbox size={22} aria-hidden />}
              title="No submissions yet"
              description="Found a bug or have a feature idea? Let the team know."
              action={
                <Link href="/submit" className={PRIMARY_LINK_CLASS}>
                  <Plus size={15} aria-hidden />
                  Create your first submission
                </Link>
              }
            />
          </div>
        ) : (
          <DashboardFilters submissions={submissionsWithVotes} />
        )}
      </main>
    </div>
  );
}