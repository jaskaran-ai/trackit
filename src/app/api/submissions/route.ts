import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { countSubmissions, createSubmission, listSubmissions } from "@/db/submissions";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";
import type { SortKey } from "@/db/submissions";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as SubmissionType | null;
  const status = searchParams.get("status") as SubmissionStatus | null;
  const priority = searchParams.get("priority") as Priority | null;
  const project = searchParams.get("project") as Project | null;
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") as SortKey | null;
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const limit = Number(searchParams.get("limit"));
  const offset = Number(searchParams.get("offset"));

  const isAdmin = session.user.role === "admin";

  const filters: Parameters<typeof listSubmissions>[0] = {
    ...(isAdmin ? {} : { userId: session.user.id }),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(project ? { project } : {}),
    ...(search ? { search } : {}),
    ...(sort ? { sort, dir } : {}),
    ...(Number.isFinite(limit) && limit > 0 ? { limit } : {}),
    ...(Number.isFinite(offset) && offset > 0 ? { offset } : {}),
  };

  const submissions = await listSubmissions(filters);

  // Total is the unpaginated count so clients can render pager controls.
  const total = await countSubmissions({
    ...(isAdmin ? {} : { userId: session.user.id }),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(project ? { project } : {}),
    ...(search ? { search } : {}),
  });

  return NextResponse.json({ submissions, total });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, title, description, priority, project, dueDate, attachments } = body;

  if (!type || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const submission = await createSubmission({
    type,
    title: title.trim(),
    description,
    priority,
    project,
    dueDate: dueDate ? new Date(dueDate) : null,
    userId: session.user.id,
    attachments,
  });

  return NextResponse.json(submission, { status: 201 });
}
