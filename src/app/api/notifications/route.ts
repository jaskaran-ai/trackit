import { NextRequest } from "next/server";
import { callProcedure, restError } from "@/orpc/rest-adapter";
import { notificationsRouter } from "@/orpc/routers/notifications";
import { badRequest } from "@/orpc/context";

/** Adapter over `notifications.list`. */
export async function GET(req: NextRequest) {
  return callProcedure(req, notificationsRouter.list, undefined);
}

/** Marks one notification read, or all of them when `all=true`. */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("all") === "true") {
    return callProcedure(req, notificationsRouter.markRead, { all: true });
  }

  const id = searchParams.get("id");
  if (!id) {
    return restError(badRequest("Missing notification id"));
  }

  return callProcedure(req, notificationsRouter.markRead, { id });
}
