import { listInstitutions } from "@/lib/admin/queries/lists";

import { AdminEmpty, AdminPageHeader, adminTableShell } from "../_components/page-header";

export const metadata = { title: "Instituciones" };

const TYPE_LABEL: Record<string, string> = {
  GOVERNMENT: "Gobierno",
  UNIVERSITY: "Universidad",
  COMPANY: "Empresa",
  NGO: "ONG",
  CHAMBER: "Cámara",
  OTHER: "Otro",
};

export default async function InstitutionsPage() {
  const rows = await listInstitutions();
  const t = adminTableShell();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        title="Instituciones"
        description="Universidades, gobiernos, empresas y cámaras que firmaron acuerdos durante ediciones del ACE."
        count={rows.length}
        countLabel="instituciones registradas"
      />

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Nombre</th>
              <th className={t.th}>Tipo</th>
              <th className={t.th}>País</th>
              <th className={t.th}>Sitio web</th>
              <th className={t.th + " text-right"}>Participantes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={t.tr}>
                <td className={t.td + " text-text font-medium"}>{row.name}</td>
                <td className={t.td + " text-text-muted text-xs"}>
                  {TYPE_LABEL[row.type] ?? row.type}
                </td>
                <td className={t.td + " text-text-muted uppercase tabular-nums"}>
                  {row.countryLabel}
                </td>
                <td className={t.td + " text-text-muted truncate max-w-[30ch] text-xs"}>
                  {row.website ? (
                    <a
                      href={row.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:underline"
                    >
                      {row.website.replace(/^https?:\/\//, "").slice(0, 40)}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={t.td + " text-text text-right font-medium tabular-nums"}>
                  {row._count.participants}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <AdminEmpty message="Aún no hay instituciones registradas. Corre npm run db:seed." />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
