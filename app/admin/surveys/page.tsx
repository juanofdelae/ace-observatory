import { listSurveys } from "@/lib/admin/queries/lists";

import { AdminEmpty, AdminPageHeader, adminTableShell } from "../_components/page-header";

export const metadata = { title: "Encuestas" };

const MILESTONE_LABEL: Record<string, string> = {
  DAY_30: "30 días",
  DAY_60: "60 días",
  DAY_90: "90 días",
  MONTH_6: "6 meses",
  MONTH_12: "12 meses",
};

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function SurveysPage() {
  const rows = await listSurveys();
  const t = adminTableShell();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        title="Encuestas"
        description="Seguimiento automático post-acuerdo. Los recordatorios se disparan a 30, 60, 90 días y 6, 12 meses."
        count={rows.length}
        countLabel="encuestas programadas"
      />

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Acuerdo / Edición</th>
              <th className={t.th}>Hito</th>
              <th className={t.th}>Programada</th>
              <th className={t.th}>Enviada</th>
              <th className={t.th}>Respondida</th>
              <th className={t.th + " text-right"}>Respuestas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={t.tr}>
                <td className={t.td + " text-text"}>
                  {row.agreement ? (
                    <span>
                      <span className="font-mono text-xs">{row.agreement.code}</span>
                      <span className="text-text-muted ml-2 text-xs">
                        {row.agreement.partyA.name} ↔ {row.agreement.partyB.name}
                      </span>
                    </span>
                  ) : row.edition ? (
                    <span className="text-text-muted text-xs">{row.edition.name}</span>
                  ) : (
                    <span className="text-text-subtle">—</span>
                  )}
                </td>
                <td className={t.td + " text-text-muted text-xs"}>
                  {row.milestone ? MILESTONE_LABEL[row.milestone] ?? row.milestone : "—"}
                </td>
                <td className={t.td + " text-text-muted text-xs tabular-nums"}>
                  {row.scheduledFor ? dateFmt.format(row.scheduledFor) : "—"}
                </td>
                <td className={t.td + " text-text-muted text-xs tabular-nums"}>
                  {row.sentAt ? dateFmt.format(row.sentAt) : "—"}
                </td>
                <td className={t.td + " text-text-muted text-xs tabular-nums"}>
                  {row.respondedAt ? dateFmt.format(row.respondedAt) : "—"}
                </td>
                <td className={t.td + " text-text text-right font-medium tabular-nums"}>
                  {row._count.responses}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <AdminEmpty message="Aún no hay encuestas programadas." />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
