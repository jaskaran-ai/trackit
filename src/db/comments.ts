import { createId } from "@paralleldrive/cuid2";
import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./index";
import { commentReaction, submissionComment } from "./schema";
import type { SubmissionComment, User } from "./types";

/** Root + three nested reply levels (depths 0–3). */
export const MAX_COMMENT_DEPTH = 3;

const commentWithUser = {
  user: {
    columns: { id: true, name: true, email: true, image: true },
  },
} as const;

export type CommentAuthor = Pick<User, "id" | "name" | "email" | "image">;

export type CommentReactionGroup = {
  emoji: string;
  users: string[];
};

export type CommentWithUser = SubmissionComment & {
  user: CommentAuthor;
  reactions: CommentReactionGroup[];
};

async function loadReactions(
  commentIds: string[],
): Promise<Map<string, CommentReactionGroup[]>> {
  const byComment = new Map<string, CommentReactionGroup[]>();
  if (commentIds.length === 0) return byComment;

  const rows = await db
    .select({
      commentId: commentReaction.commentId,
      emoji: commentReaction.emoji,
      userId: commentReaction.userId,
    })
    .from(commentReaction)
    .where(inArray(commentReaction.commentId, commentIds));

  const grouped = new Map<string, Map<string, string[]>>();
  for (const row of rows) {
    let emojis = grouped.get(row.commentId);
    if (!emojis) {
      emojis = new Map();
      grouped.set(row.commentId, emojis);
    }
    const users = emojis.get(row.emoji) ?? [];
    users.push(row.userId);
    emojis.set(row.emoji, users);
  }

  for (const [commentId, emojis] of grouped) {
    byComment.set(
      commentId,
      Array.from(emojis.entries()).map(([emoji, users]) => ({ emoji, users })),
    );
  }
  return byComment;
}

async function attachReactions(
  rows: Array<SubmissionComment & { user: CommentAuthor }>,
): Promise<CommentWithUser[]> {
  const reactions = await loadReactions(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    reactions: reactions.get(row.id) ?? [],
  }));
}

export async function listComments(submissionId: string) {
  const rows = await db.query.submissionComment.findMany({
    where: eq(submissionComment.submissionId, submissionId),
    with: commentWithUser,
    orderBy: [asc(submissionComment.createdAt)],
  });
  return attachReactions(rows);
}

export async function getCommentById(id: string) {
  const row = await db.query.submissionComment.findFirst({
    where: eq(submissionComment.id, id),
    with: commentWithUser,
  });
  if (!row) return null;
  const [withReactions] = await attachReactions([row]);
  return withReactions ?? null;
}

/** Depth of a comment: 0 root, 1–3 nested. */
export async function getCommentDepth(commentId: string): Promise<number | null> {
  let depth = 0;
  let currentId: string | null = commentId;

  while (currentId) {
    const row: { parentId: string | null } | undefined = await db.query.submissionComment.findFirst({
      where: eq(submissionComment.id, currentId),
      columns: { parentId: true },
    });
    if (!row) return null;
    if (!row.parentId) return depth;
    depth += 1;
    if (depth > MAX_COMMENT_DEPTH) return depth;
    currentId = row.parentId;
  }
  return depth;
}

export async function createComment(input: {
  submissionId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}) {
  let parentId: string | null = input.parentId ?? null;

  if (parentId) {
    const parent = await getCommentById(parentId);
    if (!parent || parent.submissionId !== input.submissionId) {
      return { error: "parent_not_found" as const };
    }
    if (parent.deletedAt) {
      return { error: "parent_deleted" as const };
    }
    const depth = await getCommentDepth(parentId);
    if (depth === null) return { error: "parent_not_found" as const };
    // Parent at max depth → attach one level up so the tree never exceeds MAX.
    if (depth >= MAX_COMMENT_DEPTH) {
      parentId = parent.parentId;
    }
  }

  const rows = await db
    .insert(submissionComment)
    .values({
      id: createId(),
      submissionId: input.submissionId,
      userId: input.userId,
      body: input.body,
      parentId,
    })
    .returning();

  const created = rows[0];
  if (!created) return { error: "insert_failed" as const };
  const full = await getCommentById(created.id);
  if (!full) return { error: "insert_failed" as const };
  return { comment: full };
}

/**
 * Soft-deletes when the comment still has live children; otherwise hard-deletes.
 * Returns whether a row remains as a deleted placeholder.
 */
export async function deleteComment(id: string) {
  const childCount = await db
    .select({ value: count() })
    .from(submissionComment)
    .where(
      and(eq(submissionComment.parentId, id), isNull(submissionComment.deletedAt)),
    );

  const hasChildren = Number(childCount[0]?.value ?? 0) > 0;

  if (hasChildren) {
    await db
      .update(submissionComment)
      .set({ deletedAt: new Date(), body: "" })
      .where(eq(submissionComment.id, id));
    await db.delete(commentReaction).where(eq(commentReaction.commentId, id));
    return { soft: true as const };
  }

  await db.delete(submissionComment).where(eq(submissionComment.id, id));
  return { soft: false as const };
}

export async function toggleCommentReaction(input: {
  commentId: string;
  userId: string;
  emoji: string;
  /** When true, ensure reaction exists; when false, remove. Omit to toggle. */
  added?: boolean;
}) {
  const existing = await db.query.commentReaction.findFirst({
    where: and(
      eq(commentReaction.commentId, input.commentId),
      eq(commentReaction.userId, input.userId),
      eq(commentReaction.emoji, input.emoji),
    ),
  });

  const shouldAdd =
    input.added === undefined ? !existing : input.added;

  if (shouldAdd) {
    if (!existing) {
      await db.insert(commentReaction).values({
        id: createId(),
        commentId: input.commentId,
        userId: input.userId,
        emoji: input.emoji,
      });
    }
    return { added: true as const };
  }

  if (existing) {
    await db
      .delete(commentReaction)
      .where(eq(commentReaction.id, existing.id));
  }
  return { added: false as const };
}

export {
  COMMENT_REACTION_EMOJI,
  isAllowedReactionEmoji,
  type CommentReactionEmoji,
} from "@/lib/comment-reactions";
