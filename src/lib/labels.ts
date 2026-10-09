import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";

/*
 * How each enum member is written for a person.
 *
 * These maps are keyed by the canonical member lists in `@/db/types`, so a
 * member added to the database without a label here is a type error rather than
 * a chip that renders the raw token.
 *
 * Colour is not here on purpose. Badge tones live with the badge component in
 * components/shared/Badges.tsx, because a tone is a design decision about what
 * a status means, not a naming convention.
 */

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  COMPLETE: "Complete",
  CANCELED: "Canceled",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const PROJECT_LABELS: Record<Project, string> = {
  IVALT_MOBILE: "iVALT Mobile App",
  DOCU_ID: "DocuID",
  ONDEMAND_ID: "OndemandID",
  KEYCLOCK: "KeyClock",
  OTHER: "Other",
};

export const TYPE_LABELS: Record<SubmissionType, string> = {
  BUG: "Bug",
  FEATURE: "Feature",
};
