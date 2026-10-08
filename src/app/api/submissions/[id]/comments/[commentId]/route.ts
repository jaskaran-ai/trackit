import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { commentsRouter } from "@/orpc/routers/comments";

type Params = { params: Promise<{ id: string; commentId: string }> };

/** Deletes a comment. Allowed for the comment's author or any admin. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, commentId } = await params;

  return callProcedure(req, commentsRouter.remove, { id, commentId });
}
