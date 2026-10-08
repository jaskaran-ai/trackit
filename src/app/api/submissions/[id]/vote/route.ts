import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { votesRouter } from "@/orpc/routers/votes";

type Params = { params: Promise<{ id: string }> };

/** Adapter over `votes.get`. */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, votesRouter.get, { id });
}

/**
 * POST and DELETE both toggle the vote, as they did before: the client sends
 * what the user clicked, not the state it thinks it's in.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, votesRouter.toggle, { id });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, votesRouter.toggle, { id });
}
