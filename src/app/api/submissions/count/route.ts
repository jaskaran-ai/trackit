import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { submissionsRouter } from "@/orpc/routers/submissions";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";

function parseStatus(raw: string | null): SubmissionStatus | SubmissionStatus[] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").filter(Boolean) as SubmissionStatus[];
  return parts.length === 1 ? parts[0] : parts;
}

/** Adapter over `submissions.count`. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  return callProcedure(req, submissionsRouter.count, {
    type: (searchParams.get("type") || undefined) as SubmissionType | undefined,
    status: parseStatus(searchParams.get("status")),
    priority: (searchParams.get("priority") || undefined) as Priority | undefined,
    project: (searchParams.get("project") || undefined) as Project | undefined,
    search: searchParams.get("search") || undefined,
    includeDeleted: searchParams.get("includeDeleted") === "true",
  });
}
