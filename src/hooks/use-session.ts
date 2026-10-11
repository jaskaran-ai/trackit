"use client";

import { useSession } from "@/lib/auth-client";
import type { SessionUser } from "@/types";

/**
 * The signed-in user for client components, so pages do not have to resolve a
 * session just to hand it down. Null while the session is loading or the user
 * is signed out, which the proxy makes unreachable for app routes.
 */
export function useCurrentUser(): SessionUser | null {
  const { data } = useSession();
  return (data?.user as SessionUser | undefined) ?? null;
}

/** True when the signed-in user is an admin. */
export function useIsAdmin(): boolean {
  return useCurrentUser()?.role === "admin";
}
