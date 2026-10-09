import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { notificationsRouter } from "@/orpc/routers/notifications";

/** Adapter over `notifications.unreadCount`. */
export async function GET(req: NextRequest) {
  return callProcedure(req, notificationsRouter.unreadCount, undefined);
}
