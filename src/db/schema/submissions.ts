import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  priorityEnum,
  projectEnum,
  submissionStatusEnum,
  submissionTypeEnum,
} from "./enums";

export const submission = pgTable(
  "submission",
  {
    id: text("id").primaryKey(),
    type: submissionTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: submissionStatusEnum("status").notNull().default("OPEN"),
    priority: priorityEnum("priority").notNull().default("MEDIUM"),
    project: projectEnum("project").notNull().default("OTHER"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // SLA / aging — optional target date and the moment it was resolved
    dueDate: timestamp("dueDate", { mode: "date" }),
    resolvedAt: timestamp("resolvedAt", { mode: "date" }),
    // Soft delete — admins archive instead of hard-deleting
    deletedAt: timestamp("deletedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("submission_userId_deletedAt_createdAt_idx").on(
      table.userId,
      table.deletedAt,
      table.createdAt,
    ),
    index("submission_deletedAt_createdAt_idx").on(
      table.deletedAt,
      table.createdAt,
    ),
    index("submission_status_idx").on(table.status),
    index("submission_type_idx").on(table.type),
    index("submission_resolvedAt_idx").on(table.resolvedAt),
  ],
);

export const attachment = pgTable(
  "attachment",
  {
    id: text("id").primaryKey(),
    submissionId: text("submissionId")
      .notNull()
      .references(() => submission.id, { onDelete: "cascade" }),
    fileName: text("fileName").notNull(),
    fileUrl: text("fileUrl").notNull(),
    fileSize: integer("fileSize").notNull(),
    mimeType: text("mimeType").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("attachment_submissionId_idx").on(table.submissionId)],
);
