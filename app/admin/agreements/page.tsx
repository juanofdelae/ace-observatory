import Link from "next/link";

import {
  countAgreementsByView,
  listAgreements,
  type AgreementView,
} from "@/lib/admin/queries/agreements";
import {
  ALERT_STATUS_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
} from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

import { InlineProgress } from "./_components/inline-progress";
import { ViewTabs, type ViewKey } from "./_components/view-tabs";

export const metadata = { title: "Acuerdos" };

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const VALID_VIEWS: ViewKey[] = ["all", "needs-attention", "active", "closed"];

type SearchParams = Promise<{ view?: string }>;

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { view: rawView } = await searchParams;
  const view: ViewKey = (VALID_VIEWS as string[]).includes(rawView ?? "")
    ? (rawView as ViewKey)
    : "all";

  // Fire both queries in parallel — both hit Postgres directly, no shared state.
  const [rows, counts] = await Promise.all([
    listAgreements({ view: view as AgreementView }),
    countAgreementsByView(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-text-muted text-xs font-semibold tracking-widest uppercase">
            OAS · RIAC · ACE
          </p>
          <h1 className="text-text mt-2 text-3xl font-semibold tracking-tight">Acuerdos</h1>
          <p className="text-text-muted mt-2 text-sm">
            {counts.all.toLocaleString()} cartas de intención y memorandos firmados durante las
            ediciones del ACE.
          </p>
        </div>
        <Link
          href="/admin/agreements/new"
          className="bg-ink hover:bg-ink-700 inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition-colors"
        >
          + Nuevo acuerdo
        </Link>
      </header>

      <ViewTabs current={view} counts={counts} />

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface-canvas text-text-subtle border-border border-b text-left text-[11px] font-medium tracking-widest uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Partes</th>
              <th className="px-4 py-3 font-medium">Edición</th>
              <th className="px-4 py-3 font-medium">Firma</th>
              <th className="px-4 py-3 font-medium">Avance</th>
              <th className="px-4 py-3 font-medium">Sector</th>
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
                  <div
                    className="text-text-muted truncate text-xs max-w-[24ch]"
                    title={row.partyBName}
                  >
                    ↔ {row.partyBName}
                  </div>
                </td>
                <td className="text-text-muted px-4 py-3">{row.editionName}</td>
                <td className="text-text-muted px-4 py-3 tabular-nums">
                  {dateFmt.format(row.signedDate)}
                </td>
                <td className="px-4 py-3">
                  <InlineProgress phase={row.phase} />
                </td>
                <td className="text-text-muted px-4 py-3 text-xs">
                  {SECTOR_LABELS[row.primarySector] ?? row.primarySector}
                </td>
                <td className="px-4 py-3">
                  <AlertPill status={row.alertStatus} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-text-subtle px-4 py-12 text-center text-sm">
                  {view === "all"
                    ? "Aún no hay acuerdos registrados. Corre npm run db:seed."
                    : "Ningún acuerdo en esta vista."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
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
      <span
        className={cn("size-1.5 rounded-full", dot[status] ?? "bg-text-subtle")}
        aria-hidden
      />
      {ALERT_STATUS_LABELS[status as keyof typeof ALERT_STATUS_LABELS] ?? status}
    </span>
  );
}
