import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { countSubmissions, countUsers } from "@/db/submissions";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [total, open, inProgress, review, complete, canceled, bugs, features, users] =
    await Promise.all([
      countSubmissions(),
      countSubmissions({ status: "OPEN" }),
      countSubmissions({ status: "IN_PROGRESS" }),
      countSubmissions({ status: "REVIEW" }),
      countSubmissions({ status: "COMPLETE" }),
      countSubmissions({ status: "CANCELED" }),
      countSubmissions({ type: "BUG" }),
      countSubmissions({ type: "FEATURE" }),
      countUsers(),
    ]);

  return NextResponse.json({
    total,
    byStatus: { open, inProgress, review, complete, canceled },
    byType: { bugs, features },
    users,
  });
}
