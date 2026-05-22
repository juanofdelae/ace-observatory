import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

/**
 * Observatory inverts Bridge's auth model: the public site stays open, only
 * /admin/* (and admin API surface) requires a session. Sign-in pages and the
 * NextAuth handler are always reachable so anonymous users can log in.
 *
 * Note: Next 16 renamed Middleware → Proxy. The export shape is identical.
 */
const ADMIN_PREFIXES = ["/admin", "/api/admin"];

function isAdminPath(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!isAdminPath(pathname)) return NextResponse.next();
  if (req.auth) return NextResponse.next();

  const signInUrl = new URL("/sign-in", req.nextUrl);
  signInUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  // Skip Next internals and static assets — only authenticate app routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)).*)"],
};
