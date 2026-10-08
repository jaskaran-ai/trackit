import type {
  attachment,
  notification,
  savedView,
  submission,
  submissionComment,
  submissionHistory,
  submissionVote,
  user,
  userPreference,
} from "./schema";

export type SubmissionType = (typeof submission.$inferSelect)["type"];
export type SubmissionStatus = (typeof submission.$inferSelect)["status"];
export type Priority = (typeof submission.$inferSelect)["priority"];
export type Project = (typeof submission.$inferSelect)["project"];

export type Submission = typeof submission.$inferSelect;
export type Attachment = typeof attachment.$inferSelect;
export type User = typeof user.$inferSelect;

export type SubmissionComment = typeof submissionComment.$inferSelect;
export type SubmissionVote = typeof submissionVote.$inferSelect;
export type SubmissionHistory = typeof submissionHistory.$inferSelect;
export type SavedView = typeof savedView.$inferSelect;
export type Notification = typeof notification.$inferSelect;
export type UserPreference = typeof userPreference.$inferSelect;

/** Fields tracked in the audit trail. */
export type HistoryField = "created" | "status" | "priority" | "dueDate" | "archived" | "restored";

export type Role = "user" | "admin";
