import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  archiveSubmission,
  countSubmissions,
  hardDeleteSubmission,
  listAttachmentsForSubmission,
  listSubmissions,
  restoreSubmission,
  updateSubmission,
} from "@/db/submissions";
import type { Priority, SubmissionStatus } from "@/db/types";
import path from "path";
import fs from "fs/promises";

type BulkAction = "status" | "priority" | "archive" | "restore" | "delete";

const ACTIONS: BulkAction[] = ["status", "priority", "archive", "restore", "delete"];
const MAX_BULK = 200;

/** Applies one admin action to many submissions in a single request. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { ids, action, value } = (await req.json()) as {
    ids?: string[];
    action?: BulkAction;
    value?: string;
  };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No submissions selected" }, { status: 400 });
  }
  if (ids.length > MAX_BULK) {
    return NextResponse.json(
      { error: `Select at most ${MAX_BULK} submissions at a time` },
      { status: 400 },
    );
  }
  if (!action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if ((action === "status" || action === "priority") && !value) {
    return NextResponse.json({ error: "A value is required" }, { status: 400 });
  }

  const actorId = guard.session.user.id;
  let changed = 0;

  for (const id of ids) {
    switch (action) {
      case "status":
        await updateSubmission(id, { status: value as SubmissionStatus }, actorId);
        break;
      case "priority":
        await updateSubmission(id, { priority: value as Priority }, actorId);
        break;
      case "archive":
        await archiveSubmission(id, actorId);
        break;
      case "restore":
        await restoreSubmission(id, actorId);
        break;
      case "delete": {
        const attachments = await listAttachmentsForSubmission(id);
        for (const att of attachments) {
          try {
            await fs.unlink(path.join(process.cwd(), "public", att.fileUrl));
          } catch {
            // ignore missing files
          }
        }
        await hardDeleteSubmission(id);
        break;
      }
    }
    changed += 1;
  }

  return NextResponse.json({ success: true, changed });
}

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  // Kept for convenience: a plain list + count so the archive view can paginate.
  const [submissions, total] = await Promise.all([
    listSubmissions({ includeDeleted: true, sort: "createdAt", dir: "desc" }),
    countSubmissions({ includeDeleted: true }),
  ]);

  return NextResponse.json({ submissions, total });
}
