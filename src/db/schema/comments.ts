import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { submission } from "./submissions";

/**
 * Replies / discussion on a submission. Nested via parentId (up to three reply
 * levels under a root). Soft-deleted rows keep place when children remain.
 */
export const submissionComment = pgTable(
  "submissionComment",
  {
    id: text("id").primaryKey(),
    body: text("body").notNull(),
    submissionId: text("submissionId")
      .notNull()
      .references(() => submission.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Null = root comment. Self-FK is declared below. */
    parentId: text("parentId"),
    deletedAt: timestamp("deletedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("submissionComment_submissionId_idx").on(table.submissionId),
    index("submissionComment_parentId_idx").on(table.parentId),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "submissionComment_parentId_fk",
    }).onDelete("cascade"),
  ],
);

/**
 * Emoji reactions on a comment. One row per (comment, user, emoji).
 */
export const commentReaction = pgTable(
  "commentReaction",
  {
    id: text("id").primaryKey(),
    commentId: text("commentId")
      .notNull()
      .references(() => submissionComment.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("commentReaction_commentId_idx").on(table.commentId),
    uniqueIndex("commentReaction_unique").on(
      table.commentId,
      table.userId,
      table.emoji,
    ),
  ],
);
