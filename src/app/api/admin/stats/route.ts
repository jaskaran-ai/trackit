import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { adminRouter } from "@/orpc/routers/admin";

/** Adapter over `admin.stats`. Admin only, as before. */
export async function GET(req: NextRequest) {
  const days = Number(new URL(req.url).searchParams.get("days")) || 30;

  return callProcedure(req, adminRouter.stats, { days });
}
