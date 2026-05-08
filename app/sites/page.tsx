"use client";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/Input";
import { FilterBar } from "@/components/FilterBar";
import { visitedSites } from "@/data/visited-sites";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { FilterState } from "@/types";
import { countryById } from "@/data/countries";
import { cityById } from "@/data/cities";

export default function SitesPage() {
  const [filters, setFilters] = useState<FilterState>({});
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return visitedSites.filter((s) => {
      if (filters.editionId && !s.relatedEditionIds.includes(filters.editionId)) return false;
      if (filters.sectorId && !s.sectorIds.includes(filters.sectorId)) return false;
      if (filters.institutionType && s.type !== filters.institutionType) return false;
      if (query && !`${s.name} ${s.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [filters, query]);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <PageHeader
        eyebrow="ACE Delegation visits"
        title="Sites visited"
        description="Companies, universities, innovation hubs and labs that ACE delegations have toured on the ground during each edition."
      />

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput
          placeholder="Search sites…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
        <FilterBar
          value={filters}
          onChange={setFilters}
          fields={["editionId", "sectorId", "institutionType"]}
          className="flex-1"
        />
      </div>

      <div className="text-xs text-text-muted">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {visitedSites.length} sites
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => {
          const c = countryById(s.countryId);
          const city = cityById(s.cityId);
          const editionNumbers = s.relatedEditionIds
            .map(id => {
              const m = /^ace-(\d+)-/.exec(id);
              return m ? Number(m[1]) : 0;
            })
            .filter(n => n > 0)
            .sort((a, b) => a - b);

          return (
            <div
              key={s.id}
              className="bg-white border border-surface-border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-shadow flex flex-col"
            >
              <div className="font-semibold text-ink text-sm leading-snug">{s.name}</div>
              <div className="text-xs text-text-muted mt-0.5">
                {s.type} · {city?.name}, {c?.name}
              </div>
              <p className="mt-3 text-sm text-text-secondary line-clamp-3 flex-1">{s.description}</p>
              <div className="mt-3 pt-3 border-t border-surface-border flex flex-wrap gap-1">
                {editionNumbers.map((n) => (
                  <span
                    key={n}
                    className="inline-block text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange"
                  >
                    ACE {n}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-dashed border-surface-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-sm">No results match these filters.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setFilters({}); setQuery(""); }}>
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
}
