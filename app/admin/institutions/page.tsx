import { listInstitutions } from "@/lib/admin/queries/lists";

import { CountryFlag } from "../_components/country-flag";
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
  const all = await listInstitutions();
  // Sort by total agreements DESC, then by name ASC as tiebreaker so rows
  // with equal counts stay alphabetical. Prisma can't sum two relation
  // counts in orderBy; for ~800 rows, sorting in JS is microseconds.
  const rows = [...all].sort((a, b) => {
    const aTotal = a._count.partsA + a._count.partsB;
    const bTotal = b._count.partsA + b._count.partsB;
    if (bTotal !== aTotal) return bTotal - aTotal;
    return a.name.localeCompare(b.name);
  });
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
              <th className={t.th + " text-right"}>Acuerdos</th>
              <th className={t.th}>Tipo</th>
              <th className={t.th}>País</th>
              <th className={t.th}>Participante(s)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const extra = row._count.participants - row.participants.length;
              const agreements = row._count.partsA + row._count.partsB;
              return (
                <tr key={row.id} className={t.tr}>
                  <td className={t.td + " text-text font-medium"}>{row.name}</td>
                  <td
                    className={
                      t.td +
                      " text-right tabular-nums " +
                      (agreements > 0 ? "text-text font-medium" : "text-text-subtle")
                    }
                  >
                    {agreements}
                  </td>
                  <td className={t.td + " text-text-muted text-xs"}>
                    {TYPE_LABEL[row.type] ?? row.type}
                  </td>
                  <td className={t.td + " text-text-muted tabular-nums"}>
                    <span className="inline-flex items-center gap-1.5">
                      <CountryFlag
                        code={row.countryId}
                        title={row.countryLabel}
                        className="text-sm"
                      />
                      <span className="uppercase">{row.countryLabel}</span>
                    </span>
                  </td>
                  <td className={t.td + " text-text-muted text-xs"}>
                    {row.participants.length === 0 ? (
                      <span className="text-text-subtle">—</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {row.participants.map((p, i) => (
                          <span key={p.id} className="text-text">
                            {p.fullName}
                            {p.position ? (
                              <span className="text-text-subtle"> · {p.position}</span>
                            ) : null}
                            {i < row.participants.length - 1 ? (
                              <span className="text-text-subtle">,</span>
                            ) : null}
                          </span>
                        ))}
                        {extra > 0 ? (
                          <span
                            className="bg-surface-canvas text-text-muted inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            title={`${extra} participante(s) más en esta institución`}
                          >
                            +{extra} más
                          </span>
                        ) : null}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <AdminEmpty message="Aún no hay instituciones registradas. Corre npm run db:seed." />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
