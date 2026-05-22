import { listEditions } from "@/lib/admin/queries/lists";

import { AdminEmpty, AdminPageHeader, adminTableShell } from "../_components/page-header";

export const metadata = { title: "Ediciones" };

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function EditionsPage() {
  const rows = await listEditions();
  const t = adminTableShell();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        title="Ediciones"
        description="Cada edición del Americas Competitiveness Exchange con su huella registrada."
        count={rows.length}
        countLabel="ediciones del ACE"
      />

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Nombre</th>
              <th className={t.th}>Año</th>
              <th className={t.th}>Sede</th>
              <th className={t.th}>Fechas</th>
              <th className={t.th + " text-right"}>Acuerdos</th>
              <th className={t.th + " text-right"}>Participantes</th>
              <th className={t.th + " text-right"}>Reportes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={t.tr}>
                <td className={t.td + " text-text font-medium"}>{row.name}</td>
                <td className={t.td + " text-text-muted tabular-nums"}>{row.year}</td>
                <td className={t.td + " text-text-muted"}>
                  {row.hostCity}
                  {row.hostCountryId ? (
                    <span className="text-text-subtle ml-1 uppercase text-xs">
                      ({row.hostCountryId})
                    </span>
                  ) : null}
                </td>
                <td className={t.td + " text-text-muted text-xs tabular-nums"}>
                  {dateFmt.format(row.startDate)} → {dateFmt.format(row.endDate)}
                </td>
                <td className={t.td + " text-text text-right font-medium tabular-nums"}>
                  {row._count.agreements}
                </td>
                <td className={t.td + " text-text text-right font-medium tabular-nums"}>
                  {row._count.participants}
                </td>
                <td className={t.td + " text-text text-right font-medium tabular-nums"}>
                  {row._count.reports}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <AdminEmpty message="Aún no hay ediciones. Corre npm run db:seed." />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
