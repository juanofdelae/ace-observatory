"use client";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import type { Coordinates, InstitutionType } from "@/types";
import { categoryFor, SITE_CATEGORIES } from "./siteTypeConfig";
import { ATLAS_COLORS } from "./mapStyles";

interface Props {
  id: string;
  name: string;
  coordinates: Coordinates;
  /** undefined = host city marker (uses MapPin orange) */
  type?: InstitutionType;
  /** When provided, the marker renders as a US-state aggregate badge
   *  (outlined navy circle with the state abbreviation) instead of an
   *  icon-based city/site pin. */
  stateAbbr?: string;
  /** When provided, the marker renders as an ACE edition pin (orange
   *  filled circle with the edition number — e.g. "4", "22"). Used at
   *  the country level for non-US countries to disambiguate editions
   *  hosted in the same city. */
  editionNumber?: number;
  meta?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

// Build a Leaflet DivIcon from a lucide icon component. A divIcon is the only
// way to embed an inline SVG marker without shipping our own raster sprites,
// and renderToStaticMarkup keeps the icon tree-shake-friendly (no React on
// the Leaflet side at runtime).
function buildIcon(Icon: LucideIcon, color: string, selected: boolean) {
  const size = selected ? 30 : 26;
  const html = renderToStaticMarkup(
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "white",
        border: `2px solid ${selected ? "#0B1F3A" : color}`,
        boxShadow: selected
          ? "0 4px 14px rgba(11,31,58,0.35)"
          : "0 2px 6px rgba(15,23,42,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={size - 12} color={color} strokeWidth={2.2} />
    </div>,
  );
  return L.divIcon({
    html,
    className: "ace-site-marker", // overrides leaflet's default white box
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

// Edition pin — the country-level marker for non-US countries. Filled
// orange circle with the edition number (e.g. "4", "22"). Distinct from
// the host-city pin (which uses MapPin glyph) and the state badge
// (outlined navy w/ abbreviation) so the user can tell at a glance whether
// they're looking at editions, cities, or aggregated states.
function buildEditionIcon(num: number, selected: boolean) {
  const size = selected ? 38 : 34;
  const accent = ATLAS_COLORS.hostOrange;
  const navy = ATLAS_COLORS.navyDeep;
  const html = renderToStaticMarkup(
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: accent,
        border: `2px solid ${selected ? navy : "white"}`,
        boxShadow: selected
          ? "0 4px 14px rgba(11,31,58,0.45)"
          : "0 3px 10px rgba(249,115,22,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontWeight: 800,
        fontSize: num >= 10 ? 13 : 14,
        letterSpacing: "0.01em",
      }}
    >
      {num}
    </div>,
  );
  return L.divIcon({
    html,
    className: "ace-edition-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

// State badge — visually distinct from city/site pins. Outlined circle, navy
// abbreviation text, slightly larger to read as an aggregator. Orange accent
// is reserved for the selected/active state per spec.
function buildStateIcon(abbr: string, selected: boolean) {
  const size = selected ? 38 : 34;
  const accent = ATLAS_COLORS.hostOrange;
  const navy = ATLAS_COLORS.navyDeep;
  const html = renderToStaticMarkup(
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: selected ? "rgba(249,115,22,0.10)" : "white",
        border: `2px solid ${selected ? accent : navy}`,
        boxShadow: selected
          ? `0 4px 14px rgba(249,115,22,0.35)`
          : "0 2px 6px rgba(11,31,58,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: selected ? accent : navy,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.02em",
      }}
    >
      {abbr}
    </div>,
  );
  return L.divIcon({
    html,
    className: "ace-state-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

export function SiteMarker({ id, name, coordinates, type, stateAbbr, editionNumber, meta, selected, onSelect }: Props) {
  const cat = type ? categoryFor(type) : SITE_CATEGORIES.HostCity;
  // Memoising the icon prevents Leaflet from re-creating the DOM node on each
  // re-render (which would also kill the hover/click state mid-interaction).
  const icon = useMemo(
    () => editionNumber !== undefined
      ? buildEditionIcon(editionNumber, !!selected)
      : stateAbbr
        ? buildStateIcon(stateAbbr, !!selected)
        : buildIcon(cat.icon, cat.color, !!selected),
    [editionNumber, stateAbbr, cat.icon, cat.color, selected],
  );

  return (
    <Marker
      position={[coordinates.lat, coordinates.lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(id) }}
    >
      <Tooltip direction="top" offset={[0, -12]} className="ace-site-tooltip">
        <span style={{ fontWeight: 600 }}>{name}</span>
        {meta && <div style={{ fontSize: 11, opacity: 0.75 }}>{meta}</div>}
      </Tooltip>
    </Marker>
  );
}
