import { ArrowUpDown, Plus } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/app/admin/_components/page-header";
import { CountryFlag } from "@/app/admin/_components/country-flag";
import { parseFilters } from "@/lib/admin/agreements/url-state";
import { deriveNextAction } from "@/lib/admin/derive/next-action";
import {
  getCountriesForFilter,
  getEditionsForFilter,
  listAgreements,
} from "@/lib/admin/queries/agreements";
import { AlertPill } from "./_components/alert-pill";
import { DocumentPill } from "./_components/document-pill";
import { FilterBar } from "./_components/filter-bar";
import { NextActionPill } from "./_components/next-action-pill";
import { PhaseLegend } from "./_components/phase-legend";
import { PipelineCell } from "./_components/pipeline-cell";
import { RowActions } from "./_components/row-actions";
import { SearchInput } from "./_components/search-input";
import { ViewTabs } from "./_components/view-tabs";

// Strips the redundant "ACE-" prefix and 4-digit year, abbreviates the host
// city to its first three letters: LOI-ACE-22-CORDOBA-2025-002 → LOI-22-COR-002.
// Codes that don't match the canonical pattern (legacy, custom, smoke) pass
// through unchanged. Full code stays accessible via the title attribute.
function shortenCode(code: string): string {
  const m = code.match(/^([A-Z]+)-ACE-(\d+)-([A-Z]+)-\d{4}-(\d+)$/);
  if (!m) return code;
  const [, type, n, city, seq] = m;
  return `${type}-${n}-${city.slice(0, 3)}-${seq}`;
}

// Compact edition label for table columns: "ACE 23" instead of the full
// "ACE 23 — Memphis 2026". Pulls the number from the canonical edition ID
// pattern (`ace-{N}-{region}-{year}`); falls back to the full name for
// non-standard IDs. Full edition name is preserved in the title attribute.
function shortEdition(editionId: string, editionName: string): string {
  const m = editionId.match(/^ace-(\d+)/i);
  if (!m) return editionName;
  return `ACE ${m[1]}`;
}

export const metadata = { title: "Acuerdos" };
export const dynamic = "force-dynamic";

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
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex items-end justify-between gap-6">
        <AdminPageHeader
          title="Acuerdos"
          description="Mesa de control de LOIs, MOUs y contratos firmados durante las ediciones del ACE."
          count={countsPerView.all}
          countLabel={countsPerView.all === 1 ? "acuerdo registrado" : "acuerdos registrados"}
        />
        <Link
          href="/admin/agreements/new"
          className="bg-accent-orange-cta hover:bg-brand-orange-ace-hover inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white shadow-card transition-all hover:shadow-card-hover"
        >
          <Plus className="size-4" aria-hidden />
          Nuevo acuerdo
        </Link>
      </header>

      <PhaseLegend />

      <ViewTabs filters={filters} counts={countsPerView} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <SearchInput filters={filters} />
        <FilterBar filters={filters} editions={editions} countries={countries} />
      </div>

      <div className="border-surface-border bg-white shadow-card overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-canvas text-text-subtle border-border border-b text-left text-[11px] font-medium tracking-widest uppercase">
              <tr>
                <th className="px-3 py-3 font-medium">Código</th>
                <th className="px-3 py-3 font-medium">Partes</th>
                <th className="px-3 py-3 font-medium">Edición</th>
                <th className="px-3 py-3 font-medium">Fase</th>
                <th className="px-3 py-3 font-medium">Alerta</th>
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
                    <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                      <Link
                        href={`/admin/agreements/${row.id}`}
                        className="text-secondary hover:underline"
                        title={row.code}
                      >
                        {shortenCode(row.code)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown
                          className="text-text-subtle size-3.5 shrink-0"
                          strokeWidth={1.5}
                          aria-label="Relación entre las dos partes"
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-text flex max-w-[30ch] items-center gap-1.5 text-[13px]"
                            title={`${row.partyAName}${row.partyACountry ? ` — ${row.partyACountry}` : ""}`}
                          >
                            <CountryFlag
                              code={row.partyACountryCode}
                              title={row.partyACountry ?? undefined}
                              className="shrink-0 text-sm"
                            />
                            <span className="truncate">{row.partyAName}</span>
                          </div>
                          <div
                            className="text-text mt-0.5 flex max-w-[30ch] items-center gap-1.5 text-[13px]"
                            title={`${row.partyBName}${row.partyBCountry ? ` — ${row.partyBCountry}` : ""}`}
                          >
                            <CountryFlag
                              code={row.partyBCountryCode}
                              title={row.partyBCountry ?? undefined}
                              className="shrink-0 text-sm"
                            />
                            <span className="truncate">{row.partyBName}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="text-text-muted px-3 py-2.5 text-xs whitespace-nowrap"
                      title={row.editionName}
                    >
                      {shortEdition(row.editionId, row.editionName)}
                    </td>
                    <td className="px-3 py-2.5">
                      <PipelineCell phase={row.phase} closed={closed} />
                    </td>
                    <td className="px-3 py-2.5">
                      <AlertPill status={row.alertStatus} />
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
                    colSpan={9}
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
