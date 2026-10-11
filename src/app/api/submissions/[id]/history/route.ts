import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { historyRouter } from "@/orpc/routers/history";

type Params = { params: Promise<{ id: string }> };

/**
 * Adapter over `history.list`. Visible to the owner and admins.
 * Query: `limit` (default 6) and `cursor` from the previous page's `nextCursor`.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  return callProcedure(req, historyRouter.list, {
    id,
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });
}
