import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { submission } from "./submissions";

/** Audit log of every status / priority transition. */
export const submissionHistory = pgTable(
  "submissionHistory",
  {
    id: text("id").primaryKey(),
    submissionId: text("submissionId")
      .notNull()
      .references(() => submission.id, { onDelete: "cascade" }),
    // NULL for system-generated events (e.g. created)
    changedById: text("changedById").references(() => user.id, {
      onDelete: "set null",
    }),
    field: text("field").notNull(),
    fromValue: text("fromValue"),
    toValue: text("toValue"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("submissionHistory_submissionId_idx").on(table.submissionId)],
);
