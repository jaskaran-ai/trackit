import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { adminRouter } from "@/orpc/routers/admin";

/** Adapter over `admin.voteBoard`. Admin only, as before. */
export async function GET(req: NextRequest) {
  const ids =
    new URL(req.url).searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  return callProcedure(req, adminRouter.voteBoard, { ids });
}
