import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron entry point — referenced by vercel.json (`0 13 * * *`).
 * Protected by `Authorization: Bearer ${CRON_SECRET}` in production.
 *
 * STUB: the actual survey dispatcher lives in Bridge and depends on
 * `lib/surveys/dispatch.ts` (Resend + token-gated URLs). Porting that is
 * tracked as M-Admin Phase 3. For now this returns 200 so Vercel doesn't
 * mark the cron as failing during the initial deploy.
 */
export async function GET(req: NextRequest) {
  if (env.NODE_ENV === "production" && !env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, reason: "CRON_SECRET not configured on the server" },
      { status: 500 },
    );
  }
  if (env.CRON_SECRET) {
    const header = req.headers.get("authorization");
    if (header !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }
  }
  return NextResponse.json({
    ok: true,
    stub: true,
    note: "Survey dispatcher not yet ported — see M-Admin Phase 3.",
  });
}

export const POST = GET;
