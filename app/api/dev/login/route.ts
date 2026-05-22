/**
 * Dev-only backdoor login. Creates a session for the given email and sets
 * the auth cookie so you don't need a working Resend setup to demo the app.
 *
 * Hard-gated by Vercel's VERCEL_ENV (when present) so it stays available in
 * local dev AND preview deploys, but never on production. Vercel sets
 * NODE_ENV=production for ALL deploys (including preview), so checking
 * VERCEL_ENV is the only way to keep this usable during merge-PR review.
 *
 *   GET /api/dev/login?email=admin@observatory.ace&to=/admin/dashboard
 */
import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Block only on Vercel production. Allow local dev (no VERCEL_ENV) and
  // Vercel preview/development environments.
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = req.nextUrl.searchParams.get("email") ?? "admin@observatory.ace";

  // Auto-provision the seed admin on first hit so the demo flow is one click.
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Admin (dev)", role: "ADMIN" },
    update: {},
  });

  const sessionToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const redirectTo = req.nextUrl.searchParams.get("to") ?? "/admin/dashboard";
  const response = NextResponse.redirect(new URL(redirectTo, req.nextUrl));

  // NextAuth v5 prefixes the session cookie with `__Secure-` over HTTPS.
  // Using the wrong name means proxy.ts won't see the session and will bounce
  // the user back to /sign-in even though we just created the DB row.
  const isHttps = req.nextUrl.protocol === "https:";
  const cookieName = isHttps ? "__Secure-authjs.session-token" : "authjs.session-token";

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
