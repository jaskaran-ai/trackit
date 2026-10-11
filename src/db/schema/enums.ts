import { pgEnum } from "drizzle-orm/pg-core";

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
