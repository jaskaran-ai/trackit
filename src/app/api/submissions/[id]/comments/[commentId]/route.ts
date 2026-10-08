import { NextRequest, NextResponse } from "next/server";
import { canAccessSubmission, getSessionUser } from "@/lib/api-auth";
import { deleteComment, getCommentById } from "@/db/comments";
import { getSubmissionById } from "@/db/submissions";

/** Deletes a comment. Allowed for the comment's author or any admin. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const guard = await getSessionUser();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id, commentId } = await params;

  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessSubmission(guard.session.user, submission.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await getCommentById(commentId);
  if (!comment || comment.submissionId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAuthor = comment.userId === guard.session.user.id;
  const isAdmin = guard.session.user.role === "admin";
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteComment(commentId);
  return NextResponse.json({ success: true });
}
