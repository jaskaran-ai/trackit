import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { submission } from "./submissions";

/**
 * Who works on a submission. Several users can be assigned to one submission.
 * The submitter (`submission.userId`) is not an assignee unless added here.
 * The unique index stops the same person being assigned twice.
 */
export const submissionAssignee = pgTable(
  "submissionAssignee",
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
    index("submissionAssignee_submissionId_idx").on(table.submissionId),
    index("submissionAssignee_userId_idx").on(table.userId),
    uniqueIndex("submissionAssignee_unique").on(table.submissionId, table.userId),
  ],
);
