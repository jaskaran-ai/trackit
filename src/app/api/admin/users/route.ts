import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { adminRouter } from "@/orpc/routers/admin";

/** Adapter over `admin.users`. Admin only, as before. */
export async function GET(req: NextRequest) {
  const search = new URL(req.url).searchParams.get("search") ?? undefined;

  return callProcedure(req, adminRouter.users, { search });
}
