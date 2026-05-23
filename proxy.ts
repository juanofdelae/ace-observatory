// ACE Bridge section runs without in-app authentication. proxy.ts kept as a
// bare passthrough so Next 16's middleware convention still binds; access
// control is expected at the hosting layer (Cloudflare/Vercel password/HTTP
// Basic). The previous NextAuth-based gate lives in git history if you ever
// need to restore it.
import { NextResponse, type NextRequest } from "next/server";

export default function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)).*)",
  ],
};
