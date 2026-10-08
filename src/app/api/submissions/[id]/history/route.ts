import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { historyRouter } from "@/orpc/routers/history";

type Params = { params: Promise<{ id: string }> };

/** Adapter over `history.list`. Visible to the owner and admins. */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, historyRouter.list, { id });
}
