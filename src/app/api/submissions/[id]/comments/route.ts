import { NextRequest, NextResponse } from "next/server";
import { canAccessSubmission, getSessionUser } from "@/lib/api-auth";
import { createComment, listComments } from "@/db/comments";
import { createNotification } from "@/db/notifications";
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

  const comments = await listComments(id);
  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const { body } = (await req.json()) as { body?: string };

  const text = body?.trim();
  if (!text) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "Comment is too long" }, { status: 400 });
  }

  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessSubmission(guard.session.user, submission.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await createComment({ submissionId: id, userId: guard.session.user.id, body: text });
  if (!comment) {
    return NextResponse.json({ error: "Could not save comment" }, { status: 500 });
  }

  // The owner is pinged when someone else joins the discussion.
  if (submission.userId !== guard.session.user.id) {
    await createNotification({
      userId: submission.userId,
      submissionId: id,
      type: "comment",
      title: `New comment on "${submission.title}"`,
      body: guard.session.user.name,
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
