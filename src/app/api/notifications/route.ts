import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/notifications";

export async function GET() {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const [notifications, unread] = await Promise.all([
    listNotifications(guard.session.user.id),
    countUnreadNotifications(guard.session.user.id),
  ]);

  return NextResponse.json({ notifications, unread });
}

/** Marks one notification read, or all of them when `all=true`. */
export async function POST(req: NextRequest) {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);

  if (searchParams.get("all") === "true") {
    await markAllNotificationsRead(guard.session.user.id);
    return NextResponse.json({ success: true });
  }

  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing notification id" }, { status: 400 });
  }

  const updated = await markNotificationRead(id, guard.session.user.id);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
