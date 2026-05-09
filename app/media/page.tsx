"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/Input";
import { editions } from "@/data/editions";
import { countryById } from "@/data/countries";
import { editionRegion } from "@/lib/utils";

export default function MediaPage() {
  const [query, setQuery] = useState("");

  // Editions sorted from most recent to oldest by start date.
  const sorted = useMemo(() => {
    return editions
      .slice()
      .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate));
  }, []);

  const filtered = useMemo(() => {
    if (!query) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(e =>
      `${e.name} ${e.number} ${editionRegion(e)} ${countryById(e.countryId)?.name ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [sorted, query]);

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <PageHeader
        eyebrow="Evidence & storytelling"
        title="Media Gallery"
        description="One card per ACE edition — official brand mark, host country and dates. Sorted from the most recent edition to the first."
      />

      <div className="flex flex-col md:flex-row gap-3">
        <SearchInput
          placeholder="Search by edition, country or year…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
      </div>

      <div className="text-xs text-text-muted">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {editions.length} editions
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(e => {
          const country = countryById(e.countryId);
          const year = new Date(e.startDate).getUTCFullYear();
          // The Media Gallery is a "click to see the actual photos"
          // surface — when an edition has a Flickr album, send the
          // click straight there in a new tab. Editions without an
          // album (Memphis 2026, etc.) fall back to the edition page.
          const flickrUrl = e.links.photos;
          const cardClass =
            "group bg-white border border-surface-border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all relative";
          const inner = (
            <>
              <div className="relative aspect-[4/3] bg-white overflow-hidden">
                {e.heroImage && (
                  <Image
                    src={e.heroImage}
                    alt={`${e.name} logo`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-6 group-hover:scale-[1.03] transition-transform duration-500"
                  />
                )}
                {flickrUrl && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-ink text-white px-1.5 py-0.5 rounded">
                    Flickr ↗
                  </span>
                )}
              </div>
              <div className="p-3 border-t border-surface-border">
                <div className="text-sm font-semibold text-ink line-clamp-1">
                  ACE {editionRegion(e)}
                </div>
                <div className="text-[11px] text-text-muted mt-1 flex items-center gap-1.5">
                  <span>#{e.number}</span>
                  <span aria-hidden>·</span>
                  <span>{country?.name ?? "—"}</span>
                  <span aria-hidden>·</span>
                  <span>{year}</span>
                </div>
              </div>
            </>
          );

          return flickrUrl ? (
            <a
              key={e.id}
              href={flickrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClass}
              aria-label={`Open ACE ${editionRegion(e)} photos on Flickr`}
            >
              {inner}
            </a>
          ) : (
            <Link key={e.id} href={`/editions/${e.id}`} className={cardClass}>
              {inner}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-dashed border-surface-border rounded-2xl p-12 text-center shadow-soft">
          <p className="text-text-muted text-sm">No editions match your search.</p>
        </div>
      )}
    </div>
  );
}
