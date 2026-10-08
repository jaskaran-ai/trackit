import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { submissionsRouter } from "@/orpc/routers/submissions";

type Params = { params: Promise<{ id: string }> };

/** Adapter over `submissions.get`: owner or admin only. */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, submissionsRouter.get, { id });
}

/** Adapter over `submissions.update`: admin only. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  return callProcedure(req, submissionsRouter.update, { ...body, id });
}

/** Adapter over `submissions.remove`: admin only, soft delete by default. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  // The old handler read this off the query string, so keep it there.
  const permanent = new URL(req.url).searchParams.get("permanent") === "true";

  return callProcedure(req, submissionsRouter.remove, { id, permanent });
}

/** Adapter over `submissions.restore`: admin only. */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, submissionsRouter.restore, { id });
}
