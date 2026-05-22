/**
 * Dev-only backdoor login. Creates a session for the given email and sets
 * the auth cookie so you don't need a working Resend setup to demo the app.
 *
 * Returns 404 in production. Hard-gated by NODE_ENV — there is no way to
 * accidentally hit this in a deployed environment.
 *
 *   GET /api/dev/login?email=admin@observatory.ace&to=/admin/dashboard
 */
import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (env.NODE_ENV === "production") {
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
  response.cookies.set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
