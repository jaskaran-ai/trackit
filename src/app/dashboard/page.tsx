import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listSubmissions } from "@/db/submissions";
import { countVotesBySubmission, listVotedSubmissionIds } from "@/db/votes";
import Navbar from "@/components/shared/Navbar";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import Link from "next/link";
import { Plus, Bug, Sparkles, Inbox } from "lucide-react";
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

  const bugs = submissions.filter((s) => s.type === "BUG");
  const features = submissions.filter((s) => s.type === "FEATURE");
  const open = submissions.filter((s) => s.status === "OPEN");

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-700 text-white mb-1">
              My Submissions
            </h1>
            <p className="text-zinc-500 text-sm">
              Welcome back, {session.user.name?.split(" ")[0]}
            </p>
          </div>
          <Link
            href="/submit"
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-500 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            New Submission
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-up animate-fade-up-delay-1">
          {[
            { label: "Total", value: submissions.length, color: "text-white" },
            { label: "Bugs", value: bugs.length, color: "text-red-400", icon: Bug },
            { label: "Features", value: features.length, color: "text-violet-400", icon: Sparkles },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className={`font-display text-2xl font-700 ${color} mb-0.5`}>{value}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                {Icon && <Icon size={11} />}
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Submissions list */}
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-up animate-fade-up-delay-2">
            <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <Inbox size={22} className="text-zinc-600" />
            </div>
            <h3 className="font-display text-base font-600 text-zinc-300 mb-2">No submissions yet</h3>
            <p className="text-sm text-zinc-600 mb-6">
              Found a bug or have a feature idea? Let the team know.
            </p>
            <Link
              href="/submit"
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-500 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Create your first submission
            </Link>
          </div>
        ) : (
          <DashboardFilters submissions={submissionsWithVotes} />
        )}
      </main>
    </div>
  );
}
