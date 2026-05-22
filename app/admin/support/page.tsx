import { listSupportRequests } from "@/lib/admin/queries/lists";

import { AdminEmpty, AdminPageHeader, adminTableShell } from "../_components/page-header";

export const metadata = { title: "Solicitudes de apoyo" };

const CATEGORY_LABEL: Record<string, string> = {
  INFORMATION: "Información",
  FACILITATION: "Facilitación",
  CONNECTION: "Conexión",
  DOCUMENTATION: "Documentación",
  LOGISTICS: "Logística",
  STRATEGIC: "Estratégica",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelta",
  CANCELLED: "Cancelada",
};

const STATUS_DOT: Record<string, string> = {
  OPEN: "bg-state-warning",
  IN_PROGRESS: "bg-secondary",
  RESOLVED: "bg-state-active",
  CANCELLED: "bg-state-closed",
};

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: "Urgente",
  HIGH: "Alta",
  STANDARD: "Estándar",
  LOW: "Baja",
};

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function SupportPage() {
  const rows = await listSupportRequests();
  const t = adminTableShell();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        title="Solicitudes de apoyo"
        description="Pedidos de información, facilitación o conexión que llegan desde los acuerdos firmados."
        count={rows.length}
        countLabel="solicitudes registradas"
      />

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Acuerdo</th>
              <th className={t.th}>Categoría</th>
              <th className={t.th}>Prioridad</th>
              <th className={t.th}>Estado</th>
              <th className={t.th}>Asignada a</th>
              <th className={t.th}>Creada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={t.tr}>
                <td className={t.td + " text-text"}>
                  <span className="font-mono text-xs">{row.agreement.code}</span>
                  <div className="text-text-muted text-xs truncate max-w-[28ch]">
                    {row.agreement.partyA.name} ↔ {row.agreement.partyB.name}
                  </div>
                </td>
                <td className={t.td + " text-text-muted text-xs"}>
                  {CATEGORY_LABEL[row.category] ?? row.category}
                </td>
                <td className={t.td + " text-text-muted text-xs"}>
                  {PRIORITY_LABEL[row.priority] ?? row.priority}
                </td>
                <td className={t.td}>
                  <span className="border-border text-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                    <span
                      className={`size-1.5 rounded-full ${STATUS_DOT[row.status] ?? "bg-text-subtle"}`}
                      aria-hidden
                    />
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                </td>
                <td className={t.td + " text-text-muted text-xs"}>
                  {row.assignedTo?.name ?? row.assignedTo?.email ?? "Sin asignar"}
                </td>
                <td className={t.td + " text-text-muted text-xs tabular-nums"}>
                  {dateFmt.format(row.createdAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <AdminEmpty message="Ninguna solicitud registrada." />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
