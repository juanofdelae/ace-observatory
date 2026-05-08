"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/Input";
import { FilterBar } from "@/components/FilterBar";
import { ParticipantCard } from "@/components/ParticipantCard";
import { DownloadMenu, type DownloadColumn } from "@/components/DownloadMenu";
import { sectors } from "@/data/sectors";
import { participants } from "@/data/participants";
import { countryById } from "@/data/countries";
import { Button } from "@/components/ui/Button";
import { LayoutGrid, List, Share2, Users, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { FilterState, Participant } from "@/types";

export default function ParticipantsPage() {
  const [filters, setFilters] = useState<FilterState>({});
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    // Strip accents from both haystack and needle so searching "Virginia
    // Avila" matches the stored name "Virginia Ávila". Without this the
    // accented record never surfaces from a non-accented query.
    const norm = (s: string) =>
      s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const q = query ? norm(query) : "";
    return participants.filter(p => {
      if (filters.countryId && p.countryId !== filters.countryId) return false;
      if (filters.sectorId && !p.sectorIds.includes(filters.sectorId)) return false;
      if (filters.actorType && p.actorType !== filters.actorType) return false;
      if (filters.editionId && !p.editionIds.includes(filters.editionId)) return false;
      if (q) {
        if (!norm(`${p.name} ${p.organization} ${p.role}`).includes(q)) return false;
      }
      return true;
    });
  }, [filters, query]);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <PageHeader
          eyebrow="Alumni network"
          title="Delegates Directory"
          description="Leaders from government, private sector, academia and international organizations across the Americas."
        />
        <div className="flex items-center gap-2 self-start md:self-end shrink-0">
          {/* Export menu — respects the current filters (it receives the
              already-filtered `filtered` array). */}
          <DownloadMenu
            filename={buildExportFilename(filters, query)}
            title="ACE Delegates Directory"
            subtitle={buildExportSubtitle(filtered.length, participants.length, filters, query)}
            rows={filtered}
            columns={EXPORT_COLUMNS}
          />

          {/* Grid / table view toggle — same pattern as the Editions page so
              both directories feel consistent. */}
          <div className="flex items-center gap-1 bg-white border border-surface-border rounded-full p-1 shadow-soft">
            <button
              onClick={() => setView("grid")}
              className={`h-8 w-8 grid place-items-center rounded-full transition-colors ${view === "grid" ? "bg-ink text-white" : "text-text-secondary hover:text-ink"}`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`h-8 w-8 grid place-items-center rounded-full transition-colors ${view === "table" ? "bg-ink text-white" : "text-text-secondary hover:text-ink"}`}
              aria-label="Table view"
              title="Table view"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput
          placeholder="Search by name, role or organization…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
        <FilterBar
          value={filters}
          onChange={setFilters}
          fields={["countryId", "sectorId", "actorType", "editionId"]}
          className="flex-1"
        />
      </div>

      <div className="text-xs text-text-muted">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {participants.length} delegates
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-surface-border rounded-2xl p-12 text-center shadow-soft">
          <p className="text-text-muted text-sm">No participants match these filters.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setFilters({}); setQuery(""); }}>
            Reset filters
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => <ParticipantCard key={p.id} p={p} />)}
        </div>
      ) : (
        <ParticipantsTable rows={filtered} />
      )}
    </div>
  );
}

// ---------------------- Compact table view ----------------------------
//
// One row per delegate — denser than the card grid so analysts can scan
// the full roster at a glance. Each row stays clickable into the network
// view so the cross-reference flow that the cards already enable is
// preserved.
function ParticipantsTable({ rows }: { rows: Participant[] }) {
  // Name-only sort, off by default. Toggles asc → desc → off so analysts
  // can scan for likely duplicates ("Avila" vs "Ávila", "Smith" vs "Smyth")
  // without permanently disrupting the curated insertion order.
  const [nameSort, setNameSort] = useState<"asc" | "desc" | null>(null);
  const sorted = useMemo(() => {
    if (!nameSort) return rows;
    const sign = nameSort === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) => sign * a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
  }, [rows, nameSort]);
  const cycleNameSort = () =>
    setNameSort(prev => (prev === null ? "asc" : prev === "asc" ? "desc" : null));
  const SortIcon = nameSort === "asc" ? ArrowUp : nameSort === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <div className="bg-white border border-surface-border rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm">
          <thead className="bg-surface-canvas border-b border-surface-border">
            <tr className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
              <Th className="w-10" />
              <th
                scope="col"
                className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted"
              >
                <button
                  type="button"
                  onClick={cycleNameSort}
                  aria-label={`Sort by name (${nameSort ?? "off"})`}
                  className={`inline-flex items-center gap-1.5 hover:text-ink transition-colors ${
                    nameSort ? "text-ink" : ""
                  }`}
                >
                  <span>Name</span>
                  <SortIcon size={11} className={nameSort ? "" : "opacity-50"} />
                </button>
              </th>
              <Th className="hidden md:table-cell">Role</Th>
              <Th className="hidden md:table-cell">Organization</Th>
              <Th className="hidden lg:table-cell">Country</Th>
              <Th className="hidden lg:table-cell">Actor type</Th>
              <Th className="hidden xl:table-cell">Editions</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {sorted.map(p => (
              <ParticipantRow key={p.id} p={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ParticipantRow({ p }: { p: Participant }) {
  const country = countryById(p.countryId);
  const editionNumbers = [...p.editionIds]
    .map(id => Number(id.match(/^ace-(\d+)-/)?.[1] ?? 0))
    .filter(n => n > 0)
    .sort((a, b) => a - b);
  return (
    <tr className="hover:bg-surface-subtle">
      <Td className="pr-0">
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-muted border border-surface-border">
          {p.photoUrl ? (
            <Image src={p.photoUrl} alt={p.name} fill className="object-cover" sizes="36px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <Users size={14} />
            </div>
          )}
        </div>
      </Td>
      <Td>
        <Link
          href={`/participants/${p.id}`}
          className="font-semibold text-ink hover:text-brand-blue-bright transition-colors"
        >
          {p.name}
        </Link>
      </Td>
      <Td className="hidden md:table-cell text-text-secondary truncate max-w-[200px]">
        {p.role}
      </Td>
      <Td className="hidden md:table-cell text-text-secondary truncate max-w-[240px]">
        {p.organization}
      </Td>
      <Td className="hidden lg:table-cell text-text-secondary">
        {country?.name ?? p.countryId.toUpperCase()}
      </Td>
      <Td className="hidden lg:table-cell">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary whitespace-nowrap">
          {p.actorType}
        </span>
      </Td>
      <Td className="hidden xl:table-cell">
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {editionNumbers.slice(0, 4).map(n => (
            <span
              key={n}
              className="inline-block text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange"
            >
              ACE {n}
            </span>
          ))}
          {editionNumbers.length > 4 && (
            <span className="text-[9px] text-text-muted">
              +{editionNumbers.length - 4}
            </span>
          )}
        </div>
      </Td>
      <Td className="text-right">
        <Link
          href={`/network?participantId=${p.id}`}
          aria-label={`See ${p.name}'s connections in the ACE Network`}
          title="See connections in the ACE Network"
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-brand-blue-bright hover:bg-surface-canvas transition-colors"
        >
          <Share2 size={13} />
        </Link>
      </Td>
    </tr>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left font-semibold px-3 py-2.5 ${className}`}>{children}</th>
  );
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}

// ───────────────────────── EXPORT helpers ─────────────────────────
//
// The export menu shares the same `filtered` array the page is showing,
// so any combination of search + filters becomes the row-set of the
// generated CSV / PDF / Word file. Column order is institutional:
// identity → affiliation → ACE history.

const EXPORT_COLUMNS: DownloadColumn<Participant>[] = [
  { header: "Name", cell: p => p.name },
  { header: "Role", cell: p => p.role || "" },
  { header: "Organization", cell: p => p.organization || "" },
  {
    header: "Country",
    cell: p => countryById(p.countryId)?.name ?? p.countryId.toUpperCase(),
  },
  { header: "Actor type", cell: p => p.actorType },
  {
    header: "Sectors",
    cell: p =>
      p.sectorIds
        .map(id => sectors.find(s => s.id === id)?.name)
        .filter(Boolean)
        .join(", "),
  },
  {
    header: "Editions",
    cell: p =>
      p.editionIds
        .map(id => Number(id.match(/^ace-(\d+)-/)?.[1] ?? 0))
        .filter(n => n > 0)
        .sort((a, b) => a - b)
        .map(n => `ACE ${n}`)
        .join(", "),
  },
];

function buildExportFilename(filters: FilterState, query: string): string {
  const parts = ["ace-delegates"];
  if (filters.editionId) {
    const num = filters.editionId.match(/^ace-(\d+)-/)?.[1];
    if (num) parts.push(`ace${num}`);
  }
  if (filters.countryId) parts.push(filters.countryId);
  if (filters.actorType) parts.push(filters.actorType.toLowerCase().replace(/\s+/g, "-"));
  if (filters.sectorId) parts.push(filters.sectorId.replace(/^sec-/, ""));
  if (query.trim()) parts.push("search");
  parts.push(new Date().toISOString().slice(0, 10));
  return parts.join("_");
}

function buildExportSubtitle(
  shown: number,
  total: number,
  filters: FilterState,
  query: string,
): string {
  const fragments: string[] = [];
  fragments.push(`${shown} of ${total} delegates`);
  if (filters.countryId) {
    fragments.push(`country: ${countryById(filters.countryId)?.name ?? filters.countryId}`);
  }
  if (filters.editionId) {
    const num = filters.editionId.match(/^ace-(\d+)-/)?.[1];
    if (num) fragments.push(`edition: ACE ${num}`);
  }
  if (filters.actorType) fragments.push(`actor: ${filters.actorType}`);
  if (filters.sectorId) {
    fragments.push(
      `sector: ${sectors.find(s => s.id === filters.sectorId)?.name ?? filters.sectorId}`,
    );
  }
  if (query.trim()) fragments.push(`search: "${query.trim()}"`);
  return fragments.join(" · ");
}
