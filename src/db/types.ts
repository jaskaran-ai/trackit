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

/*
 * The enum members, in the order a person should meet them. Derived from the
 * types so a schema change that adds or removes a member is a type error here
 * rather than a silently stale filter dropdown.
 *
 * These are the single list for both halves of the app: the oRPC schemas
 * validate against them and the filter, badge, and board components render
 * them. Previously each side kept its own copy, and the UI derived its options
 * from the keys of a colour map, which meant a status added to the database had
 * no badge tone and no filter option until three unrelated files were updated.
 */
export const SUBMISSION_TYPES = ["BUG", "FEATURE"] as const satisfies readonly SubmissionType[];
export const SUBMISSION_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETE",
  "CANCELED",
] as const satisfies readonly SubmissionStatus[];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const satisfies readonly Priority[];
export const PROJECTS = [
  "IVALT_MOBILE",
  "DOCU_ID",
  "ONDEMAND_ID",
  "KEYCLOCK",
  "OTHER",
] as const satisfies readonly Project[];

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
