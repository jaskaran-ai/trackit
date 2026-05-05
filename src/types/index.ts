import type { Submission, Attachment, User } from "@/generated/prisma/client/client";

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
