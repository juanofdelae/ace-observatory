import { listParticipants } from "@/lib/admin/queries/lists";

import { AdminEmpty, AdminPageHeader, adminTableShell } from "../_components/page-header";

export const metadata = { title: "Participantes" };

const ACTOR_LABEL: Record<string, string> = {
  GOVERNMENT: "Gobierno",
  PRIVATE_SECTOR: "Sector privado",
  ACADEMIA: "Academia",
  INTERNATIONAL_ORG: "Organismo internacional",
  OTHER: "Otro",
};

const ROLE_LABEL: Record<string, string> = {
  DELEGATE: "Delegado",
  ORGANIZER: "Organizador",
  SPECIAL_GUEST: "Invitado especial",
  SPEAKER: "Ponente",
};

export default async function ParticipantsPage() {
  const rows = await listParticipants();
  const t = adminTableShell();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AdminPageHeader
        title="Participantes"
        description="Delegados, organizadores y ponentes de las ediciones del ACE. Mostrando los primeros 500."
        count={rows.length}
        countLabel="cargados en esta vista"
      />

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <table className={t.table}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Nombre</th>
              <th className={t.th}>Rol</th>
              <th className={t.th}>Organización</th>
              <th className={t.th}>País</th>
              <th className={t.th}>Sector</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={t.tr}>
                <td className={t.td + " text-text font-medium"}>{row.fullName}</td>
                <td className={t.td + " text-text-muted text-xs"}>
                  {ROLE_LABEL[row.participantRole] ?? row.participantRole}
                </td>
                <td className={t.td + " text-text-muted truncate max-w-[28ch]"}>
                  <div>{row.organizationLabel ?? "—"}</div>
                  {row.position ? (
                    <div className="text-text-subtle text-xs">{row.position}</div>
                  ) : null}
                </td>
                <td className={t.td + " text-text-muted uppercase tabular-nums"}>
                  {row.countryId ?? "—"}
                </td>
                <td className={t.td + " text-text-muted text-xs"}>
                  {row.actorType ? ACTOR_LABEL[row.actorType] ?? row.actorType : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <AdminEmpty message="Aún no hay participantes. Corre npm run db:seed." />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
