import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [total, open, inProgress, resolved, closed, bugs, features, users] =
    await Promise.all([
      prisma.submission.count(),
      prisma.submission.count({ where: { status: "OPEN" } }),
      prisma.submission.count({ where: { status: "IN_PROGRESS" } }),
      prisma.submission.count({ where: { status: "RESOLVED" } }),
      prisma.submission.count({ where: { status: "CLOSED" } }),
      prisma.submission.count({ where: { type: "BUG" } }),
      prisma.submission.count({ where: { type: "FEATURE" } }),
      prisma.user.count(),
    ]);

  return NextResponse.json({
    total,
    byStatus: { open, inProgress, resolved, closed },
    byType: { bugs, features },
    users,
  });
}
