import { AuthCardError, AuthCardForm } from "./_components/auth-form";

type SearchParams = Promise<{ from?: string; error?: string }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, error } = await searchParams;
  return (
    <main className="bg-surface-canvas flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <div className="border-surface-border bg-surface w-full max-w-md rounded-2xl border p-10 shadow-card">
        <p className="text-ink-muted mb-2 text-xs font-semibold tracking-widest uppercase">
          OAS · RIAC
        </p>
        <h1 className="text-ink mb-2 text-2xl font-semibold tracking-tight">
          Acceso al equipo ACE
        </h1>
        <p className="text-ink-muted mb-8 text-sm leading-relaxed">
          Ingresa tu correo institucional. Te enviaremos un enlace seguro para iniciar sesión sin
          contraseña.
        </p>

        {error ? <AuthCardError code={error} /> : null}

        <AuthCardForm redirectTo={from} />
      </div>
    </main>
  );
}
