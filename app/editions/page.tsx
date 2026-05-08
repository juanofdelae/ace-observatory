"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditionCard } from "@/components/EditionCard";
import { FilterBar } from "@/components/FilterBar";
import { editions } from "@/data/editions";
import { SearchInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LayoutGrid, List } from "lucide-react";
import type { FilterState } from "@/types";
import { Table, TBody, THead, TR, TH, TD } from "@/components/ui/Table";
import Link from "next/link";
import { countryById } from "@/data/countries";
import { formatDateRange } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export default function EditionsPage() {
  const [filters, setFilters] = useState<FilterState>({});
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    return editions
      .slice()
      .reverse()
      .filter(e => {
        if (filters.year && new Date(e.startDate).getFullYear() !== filters.year) return false;
        if (filters.countryId && e.countryId !== filters.countryId) return false;
        if (filters.sectorId && !e.sectorIds.includes(filters.sectorId)) return false;
        if (query && !`${e.name} ${e.number}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      });
  }, [filters, query]);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Editions header — bare ACE logo + editorial title. No card
          background; the logo PNG is already a self-contained brandmark
          and reads cleanly on the canvas. */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6">
        <div className="flex items-center gap-5 max-w-3xl">
          <Image
            src="/logos/ace-logo.png"
            alt="ACE — Americas Competitiveness Exchange"
            width={140}
            height={140}
            sizes="140px"
            className="object-contain shrink-0"
            priority
          />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-2">
              Institutional memory · OAS
            </div>
            <h1 className="text-display-2 font-bold text-ink tracking-tight leading-[1.05]">
              ACE Editions Explorer
            </h1>
            <p className="mt-3 text-text-secondary leading-relaxed">
              Browse all 23 editions of the Americas Competitiveness Exchange —
              host cities, sectors, organizers and outcomes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white border border-surface-border rounded-full p-1 shadow-soft self-start md:self-end shrink-0">
          <button
            onClick={() => setView("grid")}
            className={`h-8 w-8 grid place-items-center rounded-full transition-colors ${view === "grid" ? "bg-ink text-white" : "text-text-secondary hover:text-ink"}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`h-8 w-8 grid place-items-center rounded-full transition-colors ${view === "table" ? "bg-ink text-white" : "text-text-secondary hover:text-ink"}`}
            aria-label="Table view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput
          placeholder="Search by edition name or number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
        <FilterBar
          value={filters}
          onChange={setFilters}
          fields={["year", "countryId", "sectorId"]}
          className="flex-1"
        />
      </div>

      <div className="text-xs text-text-muted">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {editions.length} editions
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(e => <EditionCard key={e.id} edition={e} />)}
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH className="w-16">#</TH>
              <TH>Name</TH>
              <TH>Country</TH>
              <TH>Dates</TH>
              <TH>Sectors</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map(e => {
              const c = countryById(e.countryId);
              return (
                <TR key={e.id}>
                  <TD className="font-bold text-ink">{e.number}</TD>
                  <TD>
                    <Link href={`/editions/${e.id}`} className="font-semibold text-ink hover:text-brand-blue-bright">
                      {e.name}
                    </Link>
                  </TD>
                  <TD className="text-text-secondary">{c?.name ?? "—"}</TD>
                  <TD className="text-text-secondary">{formatDateRange(e.startDate, e.endDate)}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {e.sectorIds.slice(0, 3).map(s => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s.replace("sec-", "")}</Badge>
                      ))}
                    </div>
                  </TD>
                  <TD>
                    {e.status === "upcoming" ? (
                      <Badge variant="warning">Upcoming</Badge>
                    ) : (
                      <Badge variant="outline">Completed</Badge>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      {filtered.length === 0 && (
        <div className="bg-white border border-dashed border-surface-border rounded-2xl p-12 text-center shadow-soft">
          <p className="text-text-muted text-sm">No editions match these filters.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setFilters({}); setQuery(""); }}>
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
}
