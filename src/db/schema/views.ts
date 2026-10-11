import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/** Named admin filter presets (columns, search, sort) scoped to their owner. */
export const savedView = pgTable(
  "savedView",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    filters: jsonb("filters").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("savedView_userId_idx").on(table.userId)],
);
