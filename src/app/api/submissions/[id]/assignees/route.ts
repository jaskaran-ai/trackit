import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { submissionsRouter } from "@/orpc/routers/submissions";

type Params = { params: Promise<{ id: string }> };

/** Adapter over `submissions.setAssignees`: admin only. Body: `{ userIds: string[] }`. */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  return callProcedure(req, submissionsRouter.setAssignees, { ...body, id });
}
