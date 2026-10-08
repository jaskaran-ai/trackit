import { ORPCError, os } from "@orpc/server";
import { auth } from "@/lib/auth";
import { canAccessSubmission } from "@/lib/api-auth";
import type { SessionUser } from "@/types";

/** Error codes the REST layer used to return, mapped to their HTTP status. */
export type RestErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST";

/**
 * Session shape Better Auth hands back. `user` carries the extra `role` column
 * declared in `src/lib/auth.ts`, which is what the admin gate reads.
 */
type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type ORPCUser = AuthSession["user"] & SessionUser;
export type ORPCSession = AuthSession["session"] & { id: string; userId: string };

export interface ORPCAuth {
  session: ORPCSession;
  user: ORPCUser;
}

export interface ORPCContext {
  /** Null when the request arrived without a usable session. */
  session: ORPCAuth | null;
  user: ORPCUser | null;
  /** True when the caller holds the admin role. */
  isAdmin: boolean;
  /** Session or a typed `UNAUTHORIZED` error, mirroring `getSessionUser`. */
  requireUser(): ORPCAuth;
  /** Session + admin role, mirroring `requireAdmin` from `src/lib/api-auth.ts`. */
  requireAdmin(): ORPCAuth;
  /** Owner or admin, mirroring `canAccessSubmission`. */
  canAccessSubmission(user: ORPCUser, submissionUserId: string): boolean;
}

/** Builds the request context: resolves the session and the auth helpers. */
export async function createORPCContext(request: Request): Promise<ORPCContext> {
  const result = await auth.api.getSession({ headers: request.headers });

  const session = result
    ? { session: result.session, user: result.user as ORPCUser }
    : null;

  const requireUser = (): ORPCAuth => {
    if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Unauthorized" });
    return session;
  };

  const requireAdmin = (): ORPCAuth => {
    const guarded = requireUser();
    if (guarded.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN", { message: "Forbidden" });
    }
    return guarded;
  };

  return {
    session,
    user: session?.user ?? null,
    isAdmin: session?.user.role === "admin",
    requireUser,
    requireAdmin,
    canAccessSubmission(user: ORPCUser, submissionUserId: string) {
      return canAccessSubmission(user, submissionUserId);
    },
  };
}

/** Shared helpers so every procedure throws the same typed errors. */
export function unauthorized(message = "Unauthorized") {
  return new ORPCError("UNAUTHORIZED", { message });
}

export function forbidden(message = "Forbidden") {
  return new ORPCError("FORBIDDEN", { message });
}

export function notFound(message = "Not found") {
  return new ORPCError("NOT_FOUND", { message });
}

export function badRequest(message = "Bad Request") {
  return new ORPCError("BAD_REQUEST", { message });
}

/** Maps an error code onto the HTTP status the REST routes used. */
export function statusForErrorCode(code: RestErrorCode) {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    default:
      return 400;
  }
}

// ---------------------------------------------------------------------------
// Procedure tiers
// ---------------------------------------------------------------------------

const base = os.$context<ORPCContext>();

/** Anything reachable before a session is resolved. */
export const publicProcedure = base;

/** Requires a session. Returns `401 Unauthorized` without one. */
export const protectedProcedure = base.use(({ context, next }) => {
  const { session, user } = context.requireUser();
  return next({ context: { auth: { session, user } } });
});

/** Requires the admin role. Returns `403 Forbidden` for plain users. */
export const adminProcedure = base.use(({ context, next }) => {
  const { session, user } = context.requireAdmin();
  return next({ context: { auth: { session, user } } });
});
