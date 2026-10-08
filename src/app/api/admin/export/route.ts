import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { listSubmissions } from "@/db/submissions";

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

/** CSV export of all live submissions. Mirrors the admin table's filters. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const submissions = await listSubmissions({
    ...(searchParams.get("status") ? { status: searchParams.get("status") as never } : {}),
    ...(searchParams.get("type") ? { type: searchParams.get("type") as never } : {}),
    ...(searchParams.get("priority")
      ? { priority: searchParams.get("priority") as never }
      : {}),
    ...(searchParams.get("project")
      ? { project: searchParams.get("project") as never }
      : {}),
    ...(searchParams.get("search") ? { search: searchParams.get("search")! } : {}),
    sort: "createdAt",
    dir: "desc",
  });

  const header = COLUMNS.join(",");
  const rows = submissions.map((s) =>
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
  );

  const csv = [header, ...rows].join("\r\n");
  const filename = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
