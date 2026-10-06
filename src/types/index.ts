import type { Attachment, Submission, User } from "@/db/types";

export type SubmissionWithUser = Submission & {
  user: Pick<User, "id" | "name" | "email" | "image">;
  attachments: Attachment[];
  _count?: { attachments: number };
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
};

export type {
  Attachment,
  Priority,
  Project,
  Submission,
  SubmissionStatus,
  SubmissionType,
  User,
} from "@/db/types";
