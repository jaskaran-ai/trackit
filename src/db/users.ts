import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "./index";
import { submission, user } from "./schema";
import type { Role } from "./types";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date;
  submissions: number;
};

export async function listUsers(options: { search?: string } = {}) {
  const search = options.search?.trim();

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      // Column names are camelCase in this database, hence the quoting.
      submissions: sql<number>`(
        select count(*)::int from "submission"
        where "submission"."userId" = "user"."id"
          and "submission"."deletedAt" is null
      )`,
    })
    .from(user)
    .where(
      search
        ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
        : undefined,
    )
    .orderBy(desc(user.createdAt));
}

export async function updateUserRole(userId: string, role: Role) {
  const [row] = await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  return row ?? null;
}

export async function getUserById(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function countUsers() {
  const [row] = await db.select({ value: count() }).from(user);
  return row?.value ?? 0;
}
