import { Plus } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/app/admin/_components/page-header";
import { parseFilters } from "@/lib/admin/agreements/url-state";
import { deriveNextAction } from "@/lib/admin/derive/next-action";
import {
  getCountriesForFilter,
  getEditionsForFilter,
  listAgreements,
} from "@/lib/admin/queries/agreements";
import { SECTOR_LABELS } from "@/lib/admin/schemas/agreement";

import { AlertPill } from "./_components/alert-pill";
import { DocumentPill } from "./_components/document-pill";
import { FilterBar } from "./_components/filter-bar";
import { NextActionPill } from "./_components/next-action-pill";
import { PipelineCell } from "./_components/pipeline-cell";
import { RowActions } from "./_components/row-actions";
import { SearchInput } from "./_components/search-input";
import { ViewTabs } from "./_components/view-tabs";

export const metadata = { title: "Acuerdos" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const relFmt = new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" });

const DAY_MS = 24 * 60 * 60 * 1000;

function relativeUpdate(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / DAY_MS);
  if (days === 0) return "hoy";
  if (days < 30) return relFmt.format(-days, "day");
  const months = Math.floor(days / 30);
  if (months < 12) return relFmt.format(-months, "month");
  return relFmt.format(-Math.floor(days / 365), "year");
}

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ items, countsPerView }, editions, countries] = await Promise.all([
    listAgreements(filters),
    getEditionsForFilter(),
    getCountriesForFilter(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-end justify-between gap-6">
        <AdminPageHeader
          title="Acuerdos"
          description="Mesa de control de LOIs, MOUs y contratos firmados durante las ediciones del ACE."
          count={countsPerView.all}
          countLabel={countsPerView.all === 1 ? "acuerdo registrado" : "acuerdos registrados"}
        />
        <Link
          href="/admin/agreements/new"
          className="bg-ink hover:bg-ink-700 inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-medium text-white transition-colors"
        >
          <Plus className="size-4" aria-hidden />
          Nuevo acuerdo
        </Link>
      </header>

      <ViewTabs filters={filters} counts={countsPerView} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <SearchInput filters={filters} />
        <FilterBar filters={filters} editions={editions} countries={countries} />
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-canvas text-text-subtle border-border border-b text-left text-[11px] font-medium tracking-widest uppercase">
              <tr>
                <th className="px-3 py-3 font-medium">Código</th>
                <th className="px-3 py-3 font-medium">Partes</th>
                <th className="px-3 py-3 font-medium">Edición</th>
                <th className="px-3 py-3 font-medium">Firma</th>
                <th className="px-3 py-3 font-medium">Pipeline</th>
                <th className="px-3 py-3 font-medium">Alerta</th>
                <th className="px-3 py-3 font-medium">Sector</th>
                <th className="px-3 py-3 font-medium">Actualizado</th>
                <th className="px-3 py-3 font-medium">Próxima acción</th>
                <th className="px-3 py-3 font-medium">Doc</th>
                <th className="px-3 py-3 font-medium" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const action = deriveNextAction({
                  phase: row.phase,
                  alertStatus: row.alertStatus,
                  documentUrl: row.documentUrl,
                  resultSummary: row.resultSummary,
                  updatedAt: row.updatedAt,
                });
                const closed = row.alertStatus === "CLOSED";
                return (
                  <tr
                    key={row.id}
                    className="border-border hover:bg-surface-canvas border-b last:border-0 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <Link
                        href={`/admin/agreements/${row.id}`}
                        className="text-secondary hover:underline"
                      >
                        {row.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-text max-w-[28ch] truncate" title={row.partyAName}>
                        {row.partyAName}
                        {row.partyACountry ? (
                          <span className="text-text-subtle ml-1 text-xs">
                            · {row.partyACountry}
                          </span>
                        ) : null}
                      </div>
                      <div
                        className="text-text-muted max-w-[28ch] truncate text-xs"
                        title={row.partyBName}
                      >
                        ↔ {row.partyBName}
                        {row.partyBCountry ? (
                          <span className="text-text-subtle ml-1">· {row.partyBCountry}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="text-text-muted px-3 py-2.5 text-xs">{row.editionName}</td>
                    <td className="text-text-muted px-3 py-2.5 text-xs tabular-nums">
                      {dateFmt.format(row.signedDate)}
                    </td>
                    <td className="px-3 py-2.5">
                      <PipelineCell phase={row.phase} closed={closed} />
                    </td>
                    <td className="px-3 py-2.5">
                      <AlertPill status={row.alertStatus} />
                    </td>
                    <td className="text-text-muted px-3 py-2.5 text-xs">
                      {SECTOR_LABELS[row.primarySector]}
                    </td>
                    <td className="text-text-muted px-3 py-2.5 text-xs tabular-nums">
                      {relativeUpdate(row.updatedAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <NextActionPill tone={action.tone} label={action.label} />
                    </td>
                    <td className="px-3 py-2.5">
                      <DocumentPill url={row.documentUrl} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <RowActions agreementId={row.id} />
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-text-subtle px-4 py-16 text-center text-sm"
                  >
                    No hay acuerdos que coincidan con los filtros actuales.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
