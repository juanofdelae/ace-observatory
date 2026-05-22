import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSignedUrl, isStorageConfigured } from "@/lib/admin/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/agreements/[id]/document/view
 *
 * Returns a 302 redirect to a freshly-minted Supabase signed URL for the
 * agreement's PDF. We never store the signed URL — it expires; each click
 * mints a new one. The redirect target is hidden from the user (their
 * browser follows it automatically and the inline PDF preview loads).
 *
 * Caller must already pass through proxy.ts (which gates /admin/*); this
 * route adds a second sanity check that the agreement exists + has a doc.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const agreement = await prisma.agreement.findFirst({
    where: { id, deletedAt: null },
    select: { documentUrl: true },
  });
  if (!agreement?.documentUrl) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const url = await getSignedUrl(agreement.documentUrl, 300); // 5 min
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signed URL failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
