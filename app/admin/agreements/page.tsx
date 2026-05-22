import Link from "next/link";

import { listAgreements } from "@/lib/admin/queries/agreements";
import {
  ALERT_STATUS_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
} from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

export const metadata = { title: "Acuerdos" };

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function AgreementsPage() {
  const rows = await listAgreements();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-text-muted text-xs font-semibold tracking-widest uppercase">
          OAS · RIAC · ACE
        </p>
        <h1 className="text-text mt-2 text-3xl font-semibold tracking-tight">Acuerdos</h1>
        <p className="text-text-muted mt-2 text-sm">
          {rows.length.toLocaleString()} cartas de intención y memorandos firmados durante las
          ediciones del ACE.
        </p>
      </header>

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface-canvas text-text-subtle border-border border-b text-left text-[11px] font-medium tracking-widest uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Partes</th>
              <th className="px-4 py-3 font-medium">Edición</th>
              <th className="px-4 py-3 font-medium">Firma</th>
              <th className="px-4 py-3 font-medium">Sector</th>
              <th className="px-4 py-3 font-medium">Fase</th>
              <th className="px-4 py-3 font-medium">Alerta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-border hover:bg-surface-canvas border-b last:border-0 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  <Link
                    href={`/admin/agreements/${row.id}`}
                    className="text-secondary hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="text-text px-4 py-3">
                  <div className="truncate max-w-[24ch]" title={row.partyAName}>
                    {row.partyAName}
                  </div>
                  <div className="text-text-muted truncate text-xs max-w-[24ch]" title={row.partyBName}>
                    ↔ {row.partyBName}
                  </div>
                </td>
                <td className="text-text-muted px-4 py-3">{row.editionName}</td>
                <td className="text-text-muted px-4 py-3 tabular-nums">
                  {dateFmt.format(row.signedDate)}
                </td>
                <td className="text-text-muted px-4 py-3 text-xs">
                  {SECTOR_LABELS[row.primarySector] ?? row.primarySector}
                </td>
                <td className="px-4 py-3">
                  <PhasePill phase={row.phase} />
                </td>
                <td className="px-4 py-3">
                  <AlertPill status={row.alertStatus} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-text-subtle px-4 py-12 text-center text-sm">
                  Aún no hay acuerdos registrados. Corre <code>npm run db:seed</code>.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PhasePill({ phase }: { phase: string }) {
  const dot: Record<string, string> = {
    SIGNED: "bg-primary",
    CONTACTED: "bg-secondary",
    ACTIVE: "bg-state-active",
    RESULT: "bg-accent",
  };
  return (
    <span className="border-border text-text inline-flex items-center gap-1.5 rounded-full border bg-transparent px-2.5 py-1 text-xs font-medium">
      <span className={cn("size-1.5 rounded-full", dot[phase] ?? "bg-text-subtle")} aria-hidden />
      {PHASE_LABELS[phase as keyof typeof PHASE_LABELS] ?? phase}
    </span>
  );
}

function AlertPill({ status }: { status: string }) {
  const dot: Record<string, string> = {
    ACTIVE: "bg-state-active",
    NEEDS_ATTENTION: "bg-state-warning",
    CLOSED: "bg-state-closed",
  };
  return (
    <span className="border-border text-text inline-flex items-center gap-1.5 rounded-full border bg-transparent px-2.5 py-1 text-xs font-medium">
      <span className={cn("size-1.5 rounded-full", dot[status] ?? "bg-text-subtle")} aria-hidden />
      {ALERT_STATUS_LABELS[status as keyof typeof ALERT_STATUS_LABELS] ?? status}
    </span>
  );
}
