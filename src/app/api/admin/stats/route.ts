import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getSubmissionStats } from "@/db/submissions";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const days = Number(new URL(req.url).searchParams.get("days")) || 30;
  const stats = await getSubmissionStats(days);

  return NextResponse.json({
    total: stats.total,
    byStatus: {
      open: stats.open,
      inProgress: stats.inProgress,
      review: stats.review,
      complete: stats.complete,
      canceled: stats.canceled,
    },
    byType: { bugs: stats.bugs, features: stats.features },
    users: stats.users,
    archived: stats.archived,
    overdue: stats.overdue,
    avgResolutionHours: stats.avgResolutionHours,
    byProject: stats.byProject,
    trend: stats.trend,
  });
}
