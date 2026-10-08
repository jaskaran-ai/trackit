import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { listUsers } from "@/db/users";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const search = new URL(req.url).searchParams.get("search") ?? undefined;
  const users = await listUsers({ search });

  return NextResponse.json(users);
}
