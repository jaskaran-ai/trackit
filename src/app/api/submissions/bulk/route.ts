import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { submissionsRouter } from "@/orpc/routers/submissions";

/** Adapter over `submissions.bulk`. Admin only, as before. */
export async function POST(req: NextRequest) {
  const body = await req.json();

  return callProcedure(req, submissionsRouter.bulk, body);
}

/**
 * Kept for convenience: a plain list + count so the archive view can paginate.
 * Admin only, as before.
 */
export async function GET(req: NextRequest) {
  return callProcedure(req, submissionsRouter.archived, undefined);
}
