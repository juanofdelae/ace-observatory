"use client";
import { Globe2, ChevronRight, X } from "lucide-react";
import type { AtlasSelection } from "@/types";
import { countryById } from "@/data/countries";
import { stateById } from "@/data/states";
import { cityById } from "@/data/cities";
import { siteById } from "@/data/visited-sites";
import { editionById } from "@/data/editions";

interface Props {
  selection: AtlasSelection;
  onNavigate: (s: AtlasSelection) => void;
}

export function AtlasBreadcrumb({ selection, onNavigate }: Props) {
  const country = selection.countryId ? countryById(selection.countryId) : undefined;
  const state = selection.stateId ? stateById(selection.stateId) : undefined;
  const edition = selection.editionId ? editionById(selection.editionId) : undefined;
  const city = selection.cityId ? cityById(selection.cityId) : undefined;
  const site = selection.siteId ? siteById(selection.siteId) : undefined;

  return (
    <nav className="flex items-center gap-1 text-[11.5px] font-medium overflow-x-auto thin-scroll">
      <button
        onClick={() => onNavigate({ level: "global" })}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-subtle text-text-secondary hover:text-ink whitespace-nowrap transition-colors"
      >
        <Globe2 size={12} />
        Global
      </button>

      {country && (
        <>
          <ChevronRight size={11} className="text-text-muted/70 shrink-0" />
          <button
            onClick={() => onNavigate({ level: "country", countryId: country.id })}
            className="px-2.5 py-1 rounded-full hover:bg-surface-subtle text-text-secondary hover:text-ink whitespace-nowrap transition-colors"
          >
            {country.name}
          </button>
        </>
      )}

      {state && (
        <>
          <ChevronRight size={11} className="text-text-muted/70 shrink-0" />
          <button
            onClick={() => onNavigate({ level: "state", countryId: country?.id, stateId: state.id })}
            className="px-2.5 py-1 rounded-full hover:bg-surface-subtle text-text-secondary hover:text-ink whitespace-nowrap transition-colors"
          >
            {state.name}
          </button>
        </>
      )}

      {edition && (
        <>
          <ChevronRight size={11} className="text-text-muted/70 shrink-0" />
          <button
            onClick={() => onNavigate({ level: "edition", countryId: country?.id, editionId: edition.id })}
            className="px-2.5 py-1 rounded-full hover:bg-surface-subtle text-text-secondary hover:text-ink whitespace-nowrap transition-colors"
          >
            ACE {edition.number}
          </button>
        </>
      )}

      {city && (
        <>
          <ChevronRight size={11} className="text-text-muted/70 shrink-0" />
          <button
            onClick={() => onNavigate({ level: "city", countryId: country?.id, stateId: state?.id, editionId: edition?.id, cityId: city.id })}
            className="px-2.5 py-1 rounded-full hover:bg-surface-subtle text-ink font-semibold whitespace-nowrap transition-colors"
          >
            {city.name}
          </button>
        </>
      )}

      {site && (
        <>
          <ChevronRight size={11} className="text-text-muted/70 shrink-0" />
          <span className="px-2.5 py-1 text-ink font-semibold whitespace-nowrap">{site.name}</span>
        </>
      )}

      {selection.level !== "global" && (
        <button
          onClick={() => onNavigate({ level: "global" })}
          className="ml-1.5 pl-2 border-l border-surface-border/60 flex items-center gap-1 px-2 py-1 rounded-full text-text-muted hover:text-ink hover:bg-surface-subtle whitespace-nowrap transition-colors"
        >
          <X size={11} /> Clear
        </button>
      )}
    </nav>
  );
}
