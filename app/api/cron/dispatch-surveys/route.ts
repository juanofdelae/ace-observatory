import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { dispatchDueSurveys } from "@/lib/admin/surveys/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron entry point — referenced by vercel.json (`0 13 * * *`).
 * Protected by `Authorization: Bearer ${CRON_SECRET}` in production.
 *
 * Finds every Survey row whose scheduledFor <= now and sentAt IS NULL,
 * builds a token-gated `/survey/<uniqueToken>` link, and emails both
 * signers via Resend. Rows without a real signer email (e.g. synthetic
 * @no-email.observatory.ace addresses from the seed) are skipped and
 * reported in `failed`. Idempotent — once `sentAt` is set, future runs
 * skip the row.
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
  try {
    const result = await dispatchDueSurveys();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("dispatch-surveys failed", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = GET;
