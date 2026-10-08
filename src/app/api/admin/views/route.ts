import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  createSavedView,
  deleteSavedView,
  listSavedViews,
} from "@/db/views";
import type { SavedViewFilters } from "@/db/views";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const views = await listSavedViews(guard.session.user.id);
  return NextResponse.json(views);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { name, filters } = (await req.json()) as {
    name?: string;
    filters?: SavedViewFilters;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "A view needs a name" }, { status: 400 });
  }
  if (!filters || typeof filters !== "object") {
    return NextResponse.json({ error: "A view needs filters" }, { status: 400 });
  }

  const view = await createSavedView({
    userId: guard.session.user.id,
    name: name.trim(),
    filters,
  });

  return NextResponse.json(view, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing view id" }, { status: 400 });
  }

  const deleted = await deleteSavedView(id, guard.session.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
