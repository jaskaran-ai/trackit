import { NextRequest, NextResponse } from "next/server";
import { canAccessSubmission, getSessionUser } from "@/lib/api-auth";
import { listHistory } from "@/db/history";
import { getSubmissionById } from "@/db/submissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessSubmission(guard.session.user, submission.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const history = await listHistory(id);
  return NextResponse.json(history);
}
