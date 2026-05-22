import Link from "next/link";

export default function CheckInboxPage() {
  return (
    <main className="bg-surface-canvas flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <div className="border-surface-border bg-surface w-full max-w-md rounded-2xl border p-10 text-center shadow-card">
        <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700">
          ✓
        </div>
        <h1 className="text-ink mb-3 text-xl font-semibold tracking-tight">Revisa tu correo</h1>
        <p className="text-ink-muted mb-8 text-sm leading-relaxed">
          Te enviamos un enlace de acceso. Ábrelo desde el mismo navegador en el que lo solicitaste.
          El enlace expira en 30 minutos.
        </p>
        <Link href="/sign-in" className="text-ink-muted hover:text-ink text-sm transition-colors">
          ← Usar otro correo
        </Link>
      </div>
    </main>
  );
}
