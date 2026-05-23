// Stub auth surface for the ACE Bridge section. In-app authentication is
// disabled by design — protection at the hosting layer (Cloudflare, Vercel
// password, HTTP Basic) handles access control. This file is kept (instead of
// deleted) so the seven existing import sites compile without changes; each
// export below is a deliberate no-op.
//
// To re-enable NextAuth: `git log -- lib/auth.ts` shows the original setup.

import type { UserRole } from "@prisma/client";

export const STUB_SESSION = {
  user: {
    id: "stub-testing-user",
    email: "testing@observatory.ace",
    name: "Testing",
    role: "ADMIN" as UserRole,
  },
};

type AnyFn = (...args: unknown[]) => unknown;

// NextAuth's `auth` is overloaded:
//   await auth()         → session
//   auth(handler)        → handler wrapped as middleware (HOF)
// The stub mimics both call shapes so call sites compile unchanged.
export function auth(handler?: AnyFn): unknown {
  if (typeof handler === "function") {
    return async (...args: unknown[]) => {
      const req = args[0] as { auth?: typeof STUB_SESSION } | undefined;
      if (req && typeof req === "object") req.auth = STUB_SESSION;
      return handler(...args);
    };
  }
  return Promise.resolve(STUB_SESSION);
}

export async function signIn(..._args: unknown[]): Promise<void> {
  // no-op
}

export async function signOut(..._args: unknown[]): Promise<void> {
  // no-op
}

// The NextAuth route handler is deleted in this build — these are stubs in
// case any external caller probes /api/auth/* directly.
export const handlers = {
  GET: () => new Response("Auth disabled in this build.", { status: 410 }),
  POST: () => new Response("Auth disabled in this build.", { status: 410 }),
};
