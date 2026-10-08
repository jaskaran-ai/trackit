import { NextRequest, NextResponse } from "next/server";
import { callProcedureRender } from "@/orpc/rest-adapter";
import { adminRouter } from "@/orpc/routers/admin";
import type { SubmissionWithUser } from "@/types";
import type { Priority, Project, SubmissionStatus, SubmissionType } from "@/db/types";

const COLUMNS = [
  "id",
  "type",
  "title",
  "status",
  "priority",
  "project",
  "dueDate",
  "reporter",
  "reporterEmail",
  "createdAt",
  "updatedAt",
] as const;

function escapeCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  // Guard against CSV injection: a leading =,+,-,@ is a formula in Excel.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * CSV export of all live submissions. Mirrors the admin table's filters.
 *
 * This stays bespoke REST instead of becoming a procedure: an oRPC procedure
 * returns a JSON body, and this route has to stream a file with
 * `Content-Disposition: attachment`. The row selection is the
 * `admin.exportRows` procedure, so the filter logic still lives in one place.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  return callProcedureRender<SubmissionWithUser[]>(
    req,
    adminRouter.exportRows,
    {
      ...(searchParams.get("status")
        ? { status: searchParams.get("status") as SubmissionStatus }
        : {}),
      ...(searchParams.get("type")
        ? { type: searchParams.get("type") as SubmissionType }
        : {}),
      ...(searchParams.get("priority")
        ? { priority: searchParams.get("priority") as Priority }
        : {}),
      ...(searchParams.get("project")
        ? { project: searchParams.get("project") as Project }
        : {}),
      ...(searchParams.get("search") ? { search: searchParams.get("search")! } : {}),
    },
    (submissions) => {
      const csv = [
        COLUMNS.join(","),
        ...submissions.map((s) =>
          [
            s.id,
            s.type,
            s.title,
            s.status,
            s.priority,
            s.project,
            s.dueDate ? new Date(s.dueDate).toISOString() : "",
            s.user.name,
            s.user.email,
            new Date(s.createdAt).toISOString(),
            new Date(s.updatedAt).toISOString(),
          ]
            .map(escapeCell)
            .join(","),
        ),
      ].join("\r\n");

      const filename = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    },
  );
}
