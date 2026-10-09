import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { commentsRouter } from "@/orpc/routers/comments";

type Params = { params: Promise<{ id: string; commentId: string }> };

/** Adapter over `comments.react`. */
export async function POST(req: NextRequest, { params }: Params) {
  const { id, commentId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    emoji?: string;
    added?: boolean;
  };

  return callProcedure(req, commentsRouter.react, {
    id,
    commentId,
    emoji: body.emoji,
    added: body.added,
  });
}
