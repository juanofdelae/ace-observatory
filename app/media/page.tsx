"use client";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/FilterBar";
import { SearchInput } from "@/components/ui/Input";
import { MediaCard } from "@/components/MediaCard";
import { media } from "@/data/media";
import { editionById } from "@/data/editions";
import type { FilterState } from "@/types";

export default function MediaPage() {
  const [filters, setFilters] = useState<FilterState>({});
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return media.filter(m => {
      if (filters.year && m.year !== filters.year) return false;
      if (filters.editionId && m.editionId !== filters.editionId) return false;
      if (filters.mediaType && m.type !== filters.mediaType) return false;
      if (filters.countryId) {
        const e = editionById(m.editionId);
        if (e?.countryId !== filters.countryId) return false;
      }
      if (query && !`${m.title} ${m.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [filters, query]);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <PageHeader
        eyebrow="Evidence & storytelling"
        title="Media Gallery"
        description="Photos, videos, trip books, presentations and reports — indexed by edition, country and year."
      />

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput
          placeholder="Search media…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
        <FilterBar
          value={filters}
          onChange={setFilters}
          fields={["year", "editionId", "mediaType", "countryId"]}
          className="flex-1"
        />
      </div>

      <div className="text-xs text-text-muted">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {media.length} resources
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(m => <MediaCard key={m.id} m={m} />)}
      </div>
    </div>
  );
}
