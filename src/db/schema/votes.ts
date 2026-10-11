import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { submission } from "./submissions";

/**
 * Upvotes on feature requests. One vote per user per submission — the unique
 * index is the guard, the API checks the session.
 */
export const submissionVote = pgTable(
  "submissionVote",
  {
    id: text("id").primaryKey(),
    submissionId: text("submissionId")
      .notNull()
      .references(() => submission.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("submissionVote_submissionId_idx").on(table.submissionId),
    index("submissionVote_unique").on(table.submissionId, table.userId),
  ],
);
