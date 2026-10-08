import { createId } from "@paralleldrive/cuid2";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import { submissionVote } from "./schema";

export type VoteSummary = { count: number; hasVoted: boolean };

export async function hasUserVoted(submissionId: string, userId: string) {
  const row = await db.query.submissionVote.findFirst({
    where: and(
      eq(submissionVote.submissionId, submissionId),
      eq(submissionVote.userId, userId),
    ),
  });
  return Boolean(row);
}

export async function countVotes(submissionId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(submissionVote)
    .where(eq(submissionVote.submissionId, submissionId));

  return row?.value ?? 0;
}

/** Which of these submissions has this user already voted for? */
export async function listVotedSubmissionIds(
  submissionIds: string[],
  userId: string,
) {
  if (submissionIds.length === 0) return new Set<string>();

  const rows = await db
    .selectDistinct({ submissionId: submissionVote.submissionId })
    .from(submissionVote)
    .where(
      and(
        eq(submissionVote.userId, userId),
        inArray(submissionVote.submissionId, submissionIds),
      ),
    );

  return new Set(rows.map((row) => row.submissionId));
}

/** Vote counts for many submissions in one round trip, keyed by submission. */
export async function countVotesBySubmission(submissionIds: string[]) {
  if (submissionIds.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      submissionId: submissionVote.submissionId,
      value: sql<number>`count(*)::int`,
    })
    .from(submissionVote)
    .where(inArray(submissionVote.submissionId, submissionIds))
    .groupBy(submissionVote.submissionId);

  return new Map(rows.map((row) => [row.submissionId, Number(row.value)]));
}

export async function getVoteSummary(
  submissionId: string,
  userId: string,
): Promise<VoteSummary> {
  const [hasVoted, voteCount] = await Promise.all([
    hasUserVoted(submissionId, userId),
    countVotes(submissionId),
  ]);

  return { count: voteCount, hasVoted };
}

/**
 * Toggles a vote. Returns the resulting summary so callers never have to guess
 * at the state (the unique index makes the check-and-insert race-free).
 */
export async function toggleVote(submissionId: string, userId: string) {
  const existing = await db.query.submissionVote.findFirst({
    where: and(
      eq(submissionVote.submissionId, submissionId),
      eq(submissionVote.userId, userId),
    ),
  });

  if (existing) {
    await db.delete(submissionVote).where(eq(submissionVote.id, existing.id));
  } else {
    await db
      .insert(submissionVote)
      .values({ id: createId(), submissionId, userId });
  }

  return getVoteSummary(submissionId, userId);
}
