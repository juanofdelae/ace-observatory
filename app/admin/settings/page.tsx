import { auth } from "@/lib/auth";
import { probeStorage } from "@/lib/admin/storage";

import { AdminPageHeader } from "../_components/page-header";

export const metadata = { title: "Configuración" };

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const storage = await probeStorage();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <AdminPageHeader
        title="Configuración"
        description="Diagnóstico del entorno admin del Observatorio."
      />

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="text-text mb-4 text-base font-semibold tracking-tight">Sesión</h2>
        <Row label="Usuario" value={session?.user?.email ?? "Sin sesión"} />
        <Row label="Nombre" value={session?.user?.name ?? "—"} />
        <Row label="Rol" value={session?.user?.role ?? "—"} />
      </section>

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="text-text mb-4 text-base font-semibold tracking-tight">
          Almacenamiento Supabase
        </h2>
        {storage.ok ? (
          <>
            <Row label="Estado" value="✓ Conectado" tone="ok" />
            <Row label="Bucket" value={storage.bucket} />
          </>
        ) : (
          <Row label="Estado" value={`✗ ${storage.reason}`} tone="warn" />
        )}
      </section>

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="text-text mb-4 text-base font-semibold tracking-tight">Publicación</h2>
        <p className="text-text-muted text-sm leading-relaxed">
          <code className="bg-surface-canvas rounded px-1 py-0.5 text-xs">
            POST /api/admin/publish
          </code>{" "}
          dispara la exportación de la base de datos a{" "}
          <code className="bg-surface-canvas rounded px-1 py-0.5 text-xs">data/_*.json</code>.
          Requiere rol <strong>ADMIN</strong> o <strong>EDITOR</strong>. Después de invocarlo, el
          equipo debe commit + push para gatillar la reconstrucción pública.
        </p>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  const toneClass = tone === "ok" ? "text-state-active" : tone === "warn" ? "text-state-warning" : "text-text";
  return (
    <div className="border-border flex items-baseline justify-between border-b py-2 last:border-0">
      <span className="text-text-muted text-xs uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
}
