import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { votesRouter } from "@/orpc/routers/votes";

/** Adapter over `votes.board`. */
export async function GET(req: NextRequest) {
  const ids =
    new URL(req.url).searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  return callProcedure(req, votesRouter.board, { ids });
}
