import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { env } from "@/lib/env";

type SearchParams = Promise<{ email?: string; from?: string }>;

export default async function VerifyCodePage({ searchParams }: { searchParams: SearchParams }) {
  const { email, from } = await searchParams;
  const callbackUrl = from ?? "/admin/dashboard";

  // NextAuth's Resend callback expects ?token=CODE&email=EMAIL via GET.
  const action = `${env.NEXTAUTH_URL}/api/auth/callback/resend`;

  return (
    <main className="bg-surface-canvas flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <div className="border-surface-border bg-surface w-full max-w-md rounded-2xl border p-10 shadow-card">
        <p className="text-ink-muted mb-2 text-xs font-semibold tracking-widest uppercase">
          OAS · RIAC
        </p>
        <h1 className="text-ink mb-2 text-2xl font-semibold tracking-tight">Pegá tu código</h1>
        <p className="text-ink-muted mb-8 text-sm leading-relaxed">
          {email
            ? `Te enviamos un código de 6 dígitos a ${email}. Copialo del correo y pegalo abajo.`
            : "Te enviamos un código de 6 dígitos. Copialo del correo y pegalo abajo."}
        </p>

        <form method="GET" action={action} className="space-y-4">
          {email ? <input type="hidden" name="email" value={email} /> : null}
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-2">
            <label htmlFor="token" className="text-text-secondary text-sm font-medium">
              Código de 6 dígitos
            </label>
            <Input
              id="token"
              name="token"
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              className="text-center text-2xl tracking-[0.5em] font-semibold"
            />
          </div>

          <Button type="submit" className="w-full">
            Verificar
          </Button>

          <p className="text-ink-muted pt-2 text-center text-xs">
            El código expira en 10 minutos.{" "}
            <Link
              href={email ? `/sign-in?email=${encodeURIComponent(email)}` : "/sign-in"}
              className="hover:text-ink underline"
            >
              Pedir otro
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
