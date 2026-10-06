import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createSubmission, listSubmissions } from "@/db/submissions";
import type { Priority, SubmissionStatus, SubmissionType } from "@/db/types";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as SubmissionType | null;
  const status = searchParams.get("status") as SubmissionStatus | null;
  const priority = searchParams.get("priority") as Priority | null;

  const isAdmin = session.user.role === "admin";

  const submissions = await listSubmissions({
    ...(isAdmin ? {} : { userId: session.user.id }),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  });

  return NextResponse.json(submissions);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, title, description, priority, project, attachments } = body;

  if (!type || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const submission = await createSubmission({
    type,
    title,
    description,
    priority,
    project,
    userId: session.user.id,
    attachments,
  });

  return NextResponse.json(submission, { status: 201 });
}
