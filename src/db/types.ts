import type { attachment, submission, user } from "./schema";

export type SubmissionType = (typeof submission.$inferSelect)["type"];
export type SubmissionStatus = (typeof submission.$inferSelect)["status"];
export type Priority = (typeof submission.$inferSelect)["priority"];
export type Project = (typeof submission.$inferSelect)["project"];

export type Submission = typeof submission.$inferSelect;
export type Attachment = typeof attachment.$inferSelect;
export type User = typeof user.$inferSelect;
