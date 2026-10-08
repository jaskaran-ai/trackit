import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-auth";
import { getPreferences, updatePreferences } from "@/db/preferences";
import type { UserPreferences } from "@/db/preferences";

const THEMES: Array<UserPreferences["theme"]> = ["dark", "light", "system"];

export async function GET() {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const preferences = await getPreferences(guard.session.user.id);
  return NextResponse.json(preferences);
}

export async function PATCH(req: NextRequest) {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = (await req.json()) as Partial<UserPreferences>;

  const patch: Partial<UserPreferences> = {};

  if (body.theme !== undefined) {
    if (!THEMES.includes(body.theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }
    patch.theme = body.theme;
  }

  if (body.inAppNotifications !== undefined) {
    patch.inAppNotifications = Boolean(body.inAppNotifications);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const preferences = await updatePreferences(guard.session.user.id, patch);
  return NextResponse.json(preferences);
}
