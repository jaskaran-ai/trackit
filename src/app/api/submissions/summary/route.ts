import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { submissionsRouter } from "@/orpc/routers/submissions";

/** Adapter over `submissions.summary`. */
export async function GET(req: NextRequest) {
  return callProcedure(req, submissionsRouter.summary, undefined);
}
