import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { submission } from "./submissions";

/** In-app notifications. No external email dependency by design. */
export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submissionId: text("submissionId").references(() => submission.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_userId_read_idx").on(table.userId, table.read),
  ],
);
