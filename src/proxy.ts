import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/*
 * Route gate. Runs before rendering and only reads the session cookie, so it
 * stays on the edge and never touches the database. The cookie is a token, not
 * a verified session: a signed-in page still calls requireUser(), which checks
 * the session against the DB and is the authoritative guard. This proxy only
 * decides where a request is allowed to go.
 */

/** Routes that never require a session. */
function isPublic(pathname: string) {
  return pathname.startsWith("/auth");
}

function redirectTo(target: string, request: NextRequest) {
  return NextResponse.redirect(new URL(target, request.url));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = Boolean(getSessionCookie(request));

  // Signed in: the sign-in screen has nothing to offer.
  if (signedIn && isPublic(pathname)) return redirectTo("/dashboard", request);

  // Signed out: every other route is behind the gate. Send the user back to
  // where they were headed once Google finishes signing them in.
  if (!signedIn && !isPublic(pathname)) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return redirectTo(`/auth/signin?next=${next}`, request);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except APIs, Next's internals, and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
