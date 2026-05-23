import { NextResponse } from "next/server";

/**
 * ⚠️ AUTH TEMPORARILY DISABLED — open testing window
 *
 * The whole /admin/* surface is intentionally unauthenticated right now so
 * the team can stress-test the platform without dealing with magic-link or
 * OTP friction. RE-ENABLE before sharing the URL publicly:
 *
 *   1. Restore the original `auth(...)` wrapper from git history:
 *      git show main:proxy.ts (pre commit "chore: temp-disable auth")
 *   2. Re-import { auth } from "@/lib/auth"
 *   3. Verify the OTP flow works end-to-end (separate sub-PR pending)
 *
 * Tracked as M-Auth-Reenable in MERGE_PLAN.
 */
export default function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)).*)"],
};
