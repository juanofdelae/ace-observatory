import Link from "next/link";

type SearchParams = Promise<{ error?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Tu cuenta no tiene acceso a este sistema. Contacta al administrador ACE.",
  Configuration: "El sistema de autenticación está mal configurado. Avisa al equipo técnico.",
  Verification: "El enlace expiró o ya fue usado. Solicita uno nuevo.",
};

export default async function SignInErrorPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const message = (error && ERROR_MESSAGES[error]) ?? "No pudimos completar el inicio de sesión.";

  return (
    <main className="bg-surface-canvas flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <div className="border-surface-border bg-surface w-full max-w-md rounded-2xl border p-10 text-center shadow-card">
        <h1 className="text-ink mb-3 text-xl font-semibold tracking-tight">
          No pudimos iniciar sesión
        </h1>
        <p className="text-ink-muted mb-8 text-sm leading-relaxed">{message}</p>
        <Link
          href="/sign-in"
          className="bg-ink hover:bg-ink-700 inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition-colors"
        >
          Intentar de nuevo
        </Link>
      </div>
    </main>
  );
}
