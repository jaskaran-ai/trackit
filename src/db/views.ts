import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq } from "drizzle-orm";
import { db } from "./index";
import { savedView } from "./schema";

export type SavedViewFilters = {
  search?: string;
  type?: string;
  status?: string;
  priority?: string;
  project?: string;
  sort?: { key: string; dir: "asc" | "desc" };
};

export async function listSavedViews(userId: string) {
  return db.query.savedView.findMany({
    where: eq(savedView.userId, userId),
    orderBy: [asc(savedView.createdAt)],
  });
}

export async function createSavedView(input: {
  userId: string;
  name: string;
  filters: SavedViewFilters;
}) {
  const rows = await db
    .insert(savedView)
    .values({
      id: createId(),
      userId: input.userId,
      name: input.name,
      filters: input.filters,
    })
    .returning();

  return rows[0] ?? null;
}

/** Scoped by userId so one admin can never delete another's view. */
export async function deleteSavedView(id: string, userId: string) {
  const [row] = await db
    .delete(savedView)
    .where(and(eq(savedView.id, id), eq(savedView.userId, userId)))
    .returning();

  return row ?? null;
}
