import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import path from "path";
import fs from "fs/promises";
import {
  archiveSubmission,
  getSubmissionById,
  hardDeleteSubmission,
  listAttachmentsForSubmission,
  restoreSubmission,
  updateSubmission,
} from "@/db/submissions";
import type { Priority, SubmissionStatus } from "@/db/types";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 } as const;
  if (session.user.role !== "admin") {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { session } as const;
}

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
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, priority, dueDate } = body as {
    status?: SubmissionStatus;
    priority?: Priority;
    dueDate?: string | null;
  };

  const submission = await updateSubmission(
    id,
    {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(dueDate !== undefined
        ? { dueDate: dueDate ? new Date(dueDate) : null }
        : {}),
    },
    guard.session.user.id,
  );

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(submission);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const permanent = new URL(req.url).searchParams.get("permanent") === "true";

  if (permanent) {
    // Unlink files first so a failed delete can't orphan stored assets.
    const attachments = await listAttachmentsForSubmission(id);
    for (const att of attachments) {
      try {
        const filePath = path.join(process.cwd(), "public", att.fileUrl);
        await fs.unlink(filePath);
      } catch {
        // ignore missing files
      }
    }

    const deleted = await hardDeleteSubmission(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, permanent: true });
  }

  const archived = await archiveSubmission(id, guard.session.user.id);
  if (!archived) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, permanent: false });
}

/** Restores an archived submission. Admin only. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const restored = await restoreSubmission(id, guard.session.user.id);
  if (!restored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
