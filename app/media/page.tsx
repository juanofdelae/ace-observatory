"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Image as ImgIcon, Play } from "lucide-react";
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(e => {
          const country = countryById(e.countryId);
          const year = new Date(e.startDate).getUTCFullYear();
          // Two equal media destinations are surfaced inline on each
          // card so the user sees BOTH options at a glance — Photos
          // (Flickr) and Videos (YouTube) — and picks the one they
          // want without an extra navigation step.
          const flickrUrl = e.links.photos;
          const youtubeUrl = e.links.videos;
          return (
            <div
              key={e.id}
              className="group bg-white border border-surface-border rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col"
            >
              <Link
                href={`/editions/${e.id}`}
                className="relative aspect-[4/3] bg-white overflow-hidden block"
              >
                {e.heroImage && (
                  <Image
                    src={e.heroImage}
                    alt={`${e.name} logo`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-6 group-hover:scale-[1.03] transition-transform duration-500"
                  />
                )}
              </Link>
              <div className="px-3 pt-3">
                <Link
                  href={`/editions/${e.id}`}
                  className="block hover:text-accent-blue transition-colors"
                >
                  <div className="text-sm font-semibold text-ink line-clamp-1">
                    ACE {editionRegion(e)}
                  </div>
                </Link>
                <div className="text-[11px] text-text-muted mt-1 flex items-center gap-1.5">
                  <span>#{e.number}</span>
                  <span aria-hidden>·</span>
                  <span>{country?.name ?? "—"}</span>
                  <span aria-hidden>·</span>
                  <span>{year}</span>
                </div>
              </div>
              {/* Two action chips — visible on EVERY card. Disabled
                  state for editions where the source isn't uploaded
                  yet so the user understands the option exists in
                  principle but isn't available right now. */}
              <div className="mt-3 grid grid-cols-2 border-t border-surface-border">
                <MediaActionChip
                  href={flickrUrl}
                  icon={ImgIcon}
                  label="Photos"
                  side="left"
                  color="#0063DC"
                />
                <MediaActionChip
                  href={youtubeUrl}
                  icon={Play}
                  label="Videos"
                  side="right"
                  color="#FF0000"
                />
              </div>
            </div>
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

// Inline chip rendered at the bottom of each Media Gallery card —
// one for Photos (Flickr), one for Videos (YouTube). When the
// underlying URL is missing, the chip stays visible but disabled so
// users still see that the option exists in principle.
function MediaActionChip({
  href,
  icon: Icon,
  label,
  side,
  color,
}: {
  href: string | undefined;
  icon: typeof Play;
  label: string;
  side: "left" | "right";
  /** Brand color for the active state — Flickr blue, YouTube red. */
  color: string;
}) {
  const divider = side === "right" ? "border-l border-surface-border" : "";
  const base = `flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold transition-colors ${divider}`;
  if (!href) {
    return (
      <span
        className={`${base} text-text-muted/50 cursor-not-allowed`}
        title={`${label} not available yet`}
      >
        <Icon size={13} strokeWidth={1.75} />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Inline style so each chip can carry its own brand color
      // (Flickr blue / YouTube red) without bloating Tailwind config.
      className={`${base} hover:bg-surface-subtle`}
      style={{ color }}
    >
      <Icon size={13} strokeWidth={1.75} />
      {label}
    </a>
  );
}
