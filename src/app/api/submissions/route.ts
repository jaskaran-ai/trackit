import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { submissionsRouter } from "@/orpc/routers/submissions";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";
import type { SortKey } from "@/db/submissions";

/**
 * Thin adapter over `submissions.list`. Keeps the original REST contract
 * (query params, response shape, status codes) while the logic lives in the
 * oRPC procedure.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  return callProcedure(
    req,
    submissionsRouter.list,
    {
      type: (searchParams.get("type") || undefined) as SubmissionType | undefined,
      status: (searchParams.get("status") || undefined) as SubmissionStatus | undefined,
      priority: (searchParams.get("priority") || undefined) as Priority | undefined,
      project: (searchParams.get("project") || undefined) as Project | undefined,
      search: searchParams.get("search") || undefined,
      sort: (searchParams.get("sort") || undefined) as SortKey | undefined,
      dir: searchParams.get("dir") === "asc" ? "asc" : "desc",
      limit: Number(searchParams.get("limit")),
      offset: Number(searchParams.get("offset")),
      includeDeleted: searchParams.get("includeDeleted") === "true",
    },
  );
}

/** Thin adapter over `submissions.create`. */
export async function POST(req: NextRequest) {
  const body = await req.json();

  return callProcedure(
    req,
    submissionsRouter.create,
    body,
    201,
  );
}
