import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const submissionTypeEnum = pgEnum("SubmissionType", ["BUG", "FEATURE"]);
export const submissionStatusEnum = pgEnum("SubmissionStatus", [
  "OPEN",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETE",
  "CANCELED",
]);
export const projectEnum = pgEnum("Project", [
  "IVALT_MOBILE",
  "DOCU_ID",
  "ONDEMAND_ID",
  "KEYCLOCK",
  "OTHER",
]);
export const priorityEnum = pgEnum("Priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

// Auth tables — aligned with better-auth@1.7.7 CLI (camelCase columns match legacy Prisma DB)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text("role").default("user").notNull(),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires", { mode: "date" }),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonatedBy"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

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

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  submissions: many(submission),
  comments: many(submissionComment),
  votes: many(submissionVote),
  savedViews: many(savedView),
  notifications: many(notification),
  preference: one(userPreference),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const submissionRelations = relations(submission, ({ one, many }) => ({
  user: one(user, {
    fields: [submission.userId],
    references: [user.id],
  }),
  attachments: many(attachment),
  comments: many(submissionComment),
  votes: many(submissionVote),
  history: many(submissionHistory),
  notifications: many(notification),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  submission: one(submission, {
    fields: [attachment.submissionId],
    references: [submission.id],
  }),
}));

// ---------------------------------------------------------------------------
// Engagement layer
// ---------------------------------------------------------------------------

/**
 * Replies / discussion on a submission. Anyone who can see the submission can
 * comment; only the author or an admin can delete a comment.
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
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("submissionComment_submissionId_idx").on(table.submissionId)],
);

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

export const submissionCommentRelations = relations(
  submissionComment,
  ({ one }) => ({
    submission: one(submission, {
      fields: [submissionComment.submissionId],
      references: [submission.id],
    }),
    user: one(user, {
      fields: [submissionComment.userId],
      references: [user.id],
    }),
  }),
);

export const submissionVoteRelations = relations(submissionVote, ({ one }) => ({
  submission: one(submission, {
    fields: [submissionVote.submissionId],
    references: [submission.id],
  }),
  user: one(user, {
    fields: [submissionVote.userId],
    references: [user.id],
  }),
}));

export const submissionHistoryRelations = relations(
  submissionHistory,
  ({ one }) => ({
    submission: one(submission, {
      fields: [submissionHistory.submissionId],
      references: [submission.id],
    }),
    changedBy: one(user, {
      fields: [submissionHistory.changedById],
      references: [user.id],
    }),
  }),
);

export const savedViewRelations = relations(savedView, ({ one }) => ({
  user: one(user, {
    fields: [savedView.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  submission: one(submission, {
    fields: [notification.submissionId],
    references: [submission.id],
  }),
}));

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, {
    fields: [userPreference.userId],
    references: [user.id],
  }),
}));
