import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import path from "path";
import fs from "fs/promises";
import {
  deleteSubmission,
  getSubmissionById,
  listAttachmentsForSubmission,
  updateSubmission,
} from "@/db/submissions";
import type { Priority, SubmissionStatus } from "@/db/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "admin";
  const isOwner = submission.userId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(submission);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, priority } = body as {
    status?: SubmissionStatus;
    priority?: Priority;
  };

  const submission = await updateSubmission(id, {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  });

  return NextResponse.json(submission);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const attachments = await listAttachmentsForSubmission(id);
  for (const att of attachments) {
    try {
      const filePath = path.join(process.cwd(), "public", att.fileUrl);
      await fs.unlink(filePath);
    } catch {
      // ignore missing files
    }
  }

  await deleteSubmission(id);
  return NextResponse.json({ success: true });
}
