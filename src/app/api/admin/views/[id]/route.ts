import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { adminRouter } from "@/orpc/routers/admin";

type Params = { params: Promise<{ id: string }> };

/** Adapter over `admin.deleteView`, path variant. Admin only. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;

  return callProcedure(req, adminRouter.deleteView, { id });
}
