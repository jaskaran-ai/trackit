import { and, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
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
      submissions: sql<number>`count(${submission.id})::int`,
    })
    .from(user)
    .leftJoin(
      submission,
      and(eq(submission.userId, user.id), isNull(submission.deletedAt)),
    )
    .where(
      search
        ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
        : undefined,
    )
    .groupBy(
      user.id,
      user.name,
      user.email,
      user.image,
      user.role,
      user.createdAt,
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
