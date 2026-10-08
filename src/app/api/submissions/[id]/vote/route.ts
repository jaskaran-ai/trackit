import { NextRequest, NextResponse } from "next/server";
import { canAccessSubmission, getSessionUser } from "@/lib/api-auth";
import { getSubmissionById } from "@/db/submissions";
import { toggleVote } from "@/db/votes";

/**
 * POST/DELETE both toggle the vote — the client sends what the user clicked,
 * not the state it thinks it's in, so a double submit stays idempotent.
 */
async function toggle(req: NextRequest, id: string) {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessSubmission(guard.session.user, submission.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await toggleVote(id, guard.session.user.id);
  return NextResponse.json(summary);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggle(req, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return toggle(req, id);
}
