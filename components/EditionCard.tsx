import Link from "next/link";
import Image from "next/image";
import type { Edition } from "@/types";
import { formatDateRange, editionRegion } from "@/lib/utils";
import { countryById } from "@/data/countries";
import { cityById } from "@/data/cities";
import { participantsByEdition } from "@/data/participants";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Calendar, Users, ArrowUpRight } from "lucide-react";
import { asset } from "@/lib/asset-path";

/**
 * EditionCard — premium tablet-style panel.
 * Larger hero (4:3), data ladder below, subtle hover lift.
 *
 * Every hero is rendered uniformly: white background, `object-contain`
 * with padding so the full logo / banner is always visible (never
 * cropped), regardless of whether the source asset is a vector logo, a
 * raster banner, or a photograph. Title + city/country move into the
 * card body so the visual is clean and the editorial copy stays below.
 */
export function EditionCard({ edition }: { edition: Edition }) {
  const country = countryById(edition.countryId);
  const mainCity = edition.cityIds[0] ? cityById(edition.cityIds[0]) : undefined;
  const hero = edition.heroImage || asset("/logos/ace-logo.png");
  const participantCount = participantsByEdition(edition.id).length;

  return (
    <Link
      href={`/editions/${edition.id}`}
      className="group bg-white rounded-2xl border border-surface-border overflow-hidden shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <Image
          src={hero}
          alt={edition.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-6 group-hover:scale-[1.03] transition-transform duration-500"
        />

        {/* Top chips — dark on white for consistent contrast */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full bg-ink text-white shadow-soft">
            ACE {toRoman(edition.number)}
          </span>
          {edition.status === "upcoming" && (
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] bg-accent-orange-cta text-white px-2.5 py-1 rounded-full">
              Upcoming
            </span>
          )}
          <span className="ml-auto w-9 h-9 rounded-full flex items-center justify-center bg-white border border-surface-border text-ink shadow-soft group-hover:bg-ink group-hover:text-white group-hover:border-ink transition-colors">
            <ArrowUpRight size={16} strokeWidth={2} />
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {/* Title block — city/country eyebrow + edition name */}
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-text-muted flex items-center gap-1.5 mb-1">
            <MapPin size={10} strokeWidth={2} />
            {mainCity?.name ?? "—"} · {country?.name ?? "—"}
          </div>
          <div className="text-base font-bold text-ink leading-tight">
            {editionRegion(edition)}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} strokeWidth={1.75} className="text-text-muted" />
            <span className="font-medium">
              {formatDateRange(edition.startDate, edition.endDate)}
            </span>
          </span>
          {participantCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Users size={13} strokeWidth={1.75} className="text-text-muted" />
              <span className="font-semibold text-ink">{participantCount}</span>
              <span>leaders</span>
            </span>
          )}
        </div>

        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {edition.summary}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {edition.sectorIds.slice(0, 3).map((id) => (
            <Badge key={id} variant="outline" className="text-[10px]">
              {id.replace("sec-", "").replace(/-/g, " ")}
            </Badge>
          ))}
          {edition.sectorIds.length > 3 && (
            <Badge variant="outline" className="text-[10px]">
              +{edition.sectorIds.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [value, symbol] of map) {
    while (n >= value) { result += symbol; n -= value; }
  }
  return result;
}
