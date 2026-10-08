import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { adminRouter } from "@/orpc/routers/admin";

type Params = { params: Promise<{ id: string }> };

/** Promotes or demotes a user. Admins cannot change their own role. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { role } = await req.json();

  return callProcedure(req, adminRouter.updateUserRole, { id, role });
}
