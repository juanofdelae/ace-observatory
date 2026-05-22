import { NextResponse } from "next/server";

import { ForbiddenError, UnauthorizedError, WRITE_ROLES, requireRole } from "@/lib/admin/authz";
import { runPublish } from "@/lib/admin/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/publish — snapshot DB → data/_*.json (ADR-008).
 *
 * Gated by session (admin proxy) AND a server-side role check (only ADMIN
 * + EDITOR can publish; VIEWER cannot). The git commit + push that triggers
 * the public CI rebuild is left to the calling environment — Vercel cron
 * or a manual workflow_dispatch on the public repo. This endpoint just
 * produces the snapshot files; whoever calls it is responsible for shipping
 * them.
 */
export async function POST() {
  try {
    await requireRole(WRITE_ROLES);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  try {
    const report = await runPublish();
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      files: report,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    console.error("publish failed", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
