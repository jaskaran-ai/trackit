import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";

/*
 * Server-side session for pages. The proxy already bounces signed-out
 * requests, but it only reads the cookie; these guards hit the database, so
 * they are what actually proves the session. API route handlers should use the
 * Guard-style helpers in @/lib/api-auth instead of these.
 */

/** The signed-in user, or null. Deduped per request by React's cache(). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  return (session?.user as SessionUser | undefined) ?? null;
});

/** Page guard: returns the signed-in user or sends them to the sign-in screen. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/signin");
  return user;
}

/** Page guard: returns the user when they are an admin, else the dashboard. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
