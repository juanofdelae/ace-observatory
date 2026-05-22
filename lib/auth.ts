import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY ?? "re_dev_placeholder",
      from: env.EMAIL_FROM,
      // 30-min validity — long enough for the user to switch to their inbox.
      maxAge: 30 * 60,
    }),
  ],
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-inbox",
    error: "/sign-in/error",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
});
