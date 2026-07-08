import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { Resend as ResendClient } from "resend";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

// Switched from magic-link to 6-digit OTP because Gmail and several corporate
// email clients prefetch links for malware scanning, which "uses" the magic
// token before the human can click it — producing a Verification error.
// A short numeric code typed into the verify page is not prefetchable.
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const resendClient = env.RESEND_API_KEY ? new ResendClient(env.RESEND_API_KEY) : null;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY ?? "re_dev_placeholder",
      from: env.EMAIL_FROM,
      maxAge: 10 * 60,
      generateVerificationToken: generateOtp,
      async sendVerificationRequest({ identifier: email, token }) {
        // The code in the URL is identical to the one in the email body.
        // We email the code so the user types it into /sign-in/verify-code.
        // The fallback magic-link still works in clients that don't prefetch.
        if (!resendClient) {
          console.log(`\n[dev] Sign-in code for ${email}: ${token}\n`);
          return;
        }
        await resendClient.emails.send({
          from: env.EMAIL_FROM,
          to: email,
          subject: `ACE Observatory · Código de acceso ${token}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
              <p style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">OAS · RIAC</p>
              <h1 style="color: #0B1F3A; font-size: 22px; margin: 0 0 24px;">Tu código de acceso</h1>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                Pegá este código en la pantalla de verificación. Es válido por 10 minutos.
              </p>
              <div style="background: #F4F5F7; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="color: #0B1F3A; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${token}</p>
              </div>
              <p style="color: #64748B; font-size: 12px; line-height: 1.6; margin: 24px 0 0;">
                Si vos no pediste este código, podés ignorar este email.<br>
                Solo personal autorizado de ACE / OAS tiene acceso.
              </p>
            </div>
          `,
          text: `Tu código de acceso a ACE Observatory: ${token}\n\nVálido por 10 minutos.`,
        });
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/verify-code",
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
