import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { SessionUser } from "@/types";

type Guard<T> = { session: T } | { error: string; status: 401 | 403 | 404 };

type Session = {
  session: { id: string; userId: string };
  user: SessionUser;
};

/** Returns the current session, or a ready-made 401 response payload. */
export async function getSessionUser(): Promise<
  Guard<{ session: Session["session"]; user: SessionUser }>
> {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return { error: "Unauthorized", status: 401 };

  return { session: result };
}

/** Session + admin role check in one call. */
export async function requireAdmin(): Promise<
  Guard<{ session: Session["session"]; user: SessionUser }>
> {
  const guard = await getSessionUser();
  if ("error" in guard) return guard;

  if (guard.session.user.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return guard;
}

/** Can this user read this submission? Owner or admin. */
export function canAccessSubmission(
  user: SessionUser,
  submissionUserId: string,
) {
  return user.role === "admin" || submissionUserId === user.id;
}
