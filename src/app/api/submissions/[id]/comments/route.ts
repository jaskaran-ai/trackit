import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { commentsRouter } from "@/orpc/routers/comments";

type Params = { params: Promise<{ id: string }> };

/** Adapter over `comments.list`. Visible to the owner and admins. */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, commentsRouter.list, { id });
}

/** Adapter over `comments.create`. */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  return callProcedure(req, commentsRouter.create, { ...body, id }, 201);
}
