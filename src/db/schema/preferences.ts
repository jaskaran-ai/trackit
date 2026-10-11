import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/** Per-user UI + delivery preferences. One row per user, created lazily. */
export const userPreference = pgTable("userPreference", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  theme: text("theme").default("dark").notNull(),
  /** Design-system accent, see ACCENT_IDS in src/lib/accents.ts. */
  accent: text("accent").default("indigo").notNull(),
  inAppNotifications: boolean("inAppNotifications").default(true).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
